#!/bin/bash

# --- Configuração ---
# Endereço do Service (NodePort) no cluster; dá para sobrescrever: IP=... PORTA=... ./watch-client.sh
IP="${IP:-localhost}"
PORTA="${PORTA:-30502}"
MUSICA_URI="${MUSICA_URI:-spotify:track:06iMqWThw4w8fTFyccvOwr}"
# --------------------

URL="http://${IP}:${PORTA}/api/recommend"
PAYLOAD="{\"songs\": [\"${MUSICA_URI}\"]}"

echo "Monitorando ${URL}..."
echo "Pressione [CTRL+C] para parar."

# Loop infinito
while true
do
    # Envia o request, captura o output, e mede o tempo
    # -s (silencioso) -w (formato de tempo) -o (output)
    HTTP_STATUS=$(curl -s \
        -w "%{http_code}" \
        -o /dev/null \
        -X POST \
        -H "Content-Type: application/json" \
        -d "${PAYLOAD}" \
        "${URL}")

    # Pega o JSON de resposta (um request separado para simplicidade)
    # Usamos 'jq' para extrair os campos. Se 'jq' não estiver instalado, use 'grep'
    RESPONSE_JSON=$(curl -s -X POST -H "Content-Type: application/json" -d "${PAYLOAD}" "${URL}")
    
    # Extrai dados (Alternativa com grep se jq não funcionar: | grep version | cut -d '\"' -f 4)
    VERSION=$(echo ${RESPONSE_JSON} | jq -r .version)
    MODEL_DATE=$(echo ${RESPONSE_JSON} | jq -r .model_date)

    # Imprime o status
    echo "$(date +'%H:%M:%S') | Status: ${HTTP_STATUS} | Versão App: ${VERSION} | Data Modelo: ${MODEL_DATE}"

    # Espera 1 segundo
    sleep 1
done