import os
import pickle
import datetime
import threading
from flask import Flask, request, jsonify


# --- Configuration ---
MODEL_PATH = "/model/playlist_rules.pkl"
MODEL_VERSION = "1.0.2"

# --- App Initialization ---
app = Flask(__name__)
app.model = None
app.model_date = "N/A"
app.model_load_time = 0 # Guarda a data de modificação do arquivo
app.model_lock = threading.Lock() # Para evitar recarregar o modelo em duas requests ao mesmo tempo

def load_model(model_path):
    """
    Carrega o modelo do pickle e obtém a data de modificação.
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Arquivo de modelo não encontrado em {model_path}")
    
    # Obtém a data de modificação do arquivo
    mtime = os.path.getmtime(model_path)
    model_date = datetime.datetime.fromtimestamp(mtime).isoformat()
    
    # Carrega o modelo
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
        
    print(f"Modelo carregado com sucesso de {model_path}. Data: {model_date}")
    return model, model_date, mtime


def check_and_reload_model():
    """
    Verifica se o arquivo de modelo no disco é mais novo do que o
    que está em memória. Se for, recarrega ele.
    """
    global app
    try:
        mtime = os.path.getmtime(MODEL_PATH)
        
        # Se a data do arquivo for mais nova que a data de carregamento do modelo em memória
        if mtime > app.model_load_time:
            # Usa um "lock" para garantir que apenas uma thread recarregue o modelo
            with app.model_lock:
                # Verifica novamente, pois outra thread pode ter acabado de recarregar
                if mtime > app.model_load_time:
                    print(f"Detectada nova versão do modelo. Recarregando...")
                    app.model, app.model_date, app.model_load_time = load_model(MODEL_PATH)
                else:
                    print("Modelo já recarregado por outra thread.")
    
    except FileNotFoundError:
        print(f"AVISO: Arquivo de modelo não encontrado em {MODEL_PATH} durante a verificação.")
        app.model = None # Reseta o modelo se o arquivo sumir
        app.model_load_time = 0
    except Exception as e:
        print(f"Erro ao recarregar o modelo: {e}")

# --- Load Model on Startup ---
try:
    # Carga inicial ao iniciar o servidor
    app.model, app.model_date, app.model_load_time = load_model(MODEL_PATH)
except FileNotFoundError as e:
    print(f"FALHA NA CARGA INICIAL: {e}. Servidor iniciado sem modelo.")
    app.model = None

# --- Recommendation Logic ---
def get_recommendations(model, input_songs, max_recs=20):
    """
    Finds recommendations based on the association rules.
    """
    # Convert the list of input songs to a frozenset
    input_set = frozenset(input_songs)
    
    # Find rules where the 'antecedents' (IF part) is a subset of the user's songs
    matching_rules = model[model['antecedents'].apply(lambda x: x.issubset(input_set))]
    
    if matching_rules.empty:
        return []

    # Sort rules by confidence to get the best ones first
    matching_rules = matching_rules.sort_values('confidence', ascending=False)

    # Get all unique 'consequents' (THEN part) from the matched rules
    recommendations = []
    for consequents in matching_rules['consequents'].values:
        for song in consequents:
            # Add if it's not a song the user already has
            # and not already in our recommendation list
            if song not in input_set and song not in recommendations:
                recommendations.append(song)
    
    return recommendations[:max_recs] # Return the top N recommendations

# --- API Endpoint ---
@app.route("/api/recommend", methods=["POST"])
def recommend():
    """
    O endpoint principal de recomendação.
    """
    # **NOVO**: Verifica se o modelo mudou ANTES de processar o request
    check_and_reload_model()
    
    # Verifica se o modelo está carregado (pode ter falhado no reload)
    if app.model is None:
        return jsonify({"error": "Modelo não está carregado. Verifique os logs do servidor."}), 500

    data = request.get_json(force=True)
    if not data or 'songs' not in data:
        return jsonify({"error": "Request inválido. Faltando a chave 'songs'."}), 400
        
    input_songs = data['songs']
    if not isinstance(input_songs, list) or len(input_songs) == 0:
        return jsonify({"error": "'songs' deve ser uma lista não-vazia."}), 400

    # print(f"Recebido request para {len(input_songs)} músicas.")
    recommended_songs = get_recommendations(app.model, input_songs)
    # print(f"Encontradas {len(recommended_songs)} recomendações.")

    response = {
        "songs": recommended_songs,
        "version": MODEL_VERSION,
        "model_date": app.model_date
    }
    return jsonify(response)
