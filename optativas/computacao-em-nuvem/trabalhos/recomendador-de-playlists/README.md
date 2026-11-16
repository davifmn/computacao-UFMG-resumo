# Recomendador de playlists no Kubernetes

**Computação em Nuvem · UFMG** · Python · Flask · mlxtend · Docker · Kubernetes · Argo CD

Um serviço que recomenda músicas a partir de uma lista de músicas que o usuário já tem,
com o modelo treinado e servido dentro de um cluster Kubernetes e atualizado por GitOps.

```
           ┌────────────── PersistentVolumeClaim (modelo compartilhado) ──────────────┐
           │                                                                           │
Job ml-generator ──escreve──▶ playlist_rules.pkl ◀──lê (recarrega se mudou)── Deployment frontend (Flask, 4 réplicas)
  FP-Growth sobre as playlists                                                         ▲
                                                                                        │ POST /api/recommend
Argo CD: cada commit nos manifestos sincroniza o cluster e dispara o Job de novo   client.py, watch-client.sh
```

## Como funciona

**Treino (`ml-service/main.py`).** Cada playlist é uma "cesta" e cada música um "item".
O FP-Growth (mlxtend) acha os conjuntos de músicas frequentes (suporte ≥ 8%) e gera
**regras de associação** $A \Rightarrow B$ com confiança ≥ 50%: "quem tem as músicas de
$A$ costuma ter as de $B$". As regras vão para `playlist_rules.pkl` no volume compartilhado.

**API (`frontend-service/api.py`).** `POST /api/recommend` com `{"songs": [...]}` pega as
regras cujo antecedente está contido nas músicas enviadas, ordena por confiança e devolve
até 20 consequentes que o usuário ainda não tem, junto com a versão da API e a data do
modelo. A cada requisição, a API olha a data de modificação do `.pkl` e **recarrega o
modelo** se ele mudou (com uma trava para duas threads não recarregarem ao mesmo tempo):
o Job retreina e as réplicas passam a usar o modelo novo sem reiniciar.

**Implantação (`k8s/`).** O Job de treino é um *hook* de sincronização do Argo CD
(`argocd.argoproj.io/hook: Sync`), então roda a cada sincronização; um PVC
`ReadWriteMany` guarda o modelo; Deployment e Service (NodePort) expõem a API.
`watch-client.sh` faz uma requisição por segundo e mostra a versão e a data do modelo,
para observar uma atualização acontecendo sem queda.

## Como executar localmente

Os dados (playlists do Spotify de 2023, dois CSVs de ~40 MB com colunas `pid` e
`track_uri`) ficavam no cluster da disciplina e não estão no repositório. Com um CSV
nesse formato em `data/`:

```bash
pip install pandas mlxtend flask requests
python3 ml-service/main.py                 # gera /app/data/playlist_rules.pkl (ajuste OUTPUT_FILE)
cd frontend-service && flask --app api run --port 30502   # lê /model/playlist_rules.pkl
python3 client.py spotify:track:06iMqWThw4w8fTFyccvOwr
```

Na migração, o pipeline foi testado de ponta a ponta com um CSV sintético de 200 playlists:
14 regras geradas, e a API recomendou corretamente as músicas que sempre aparecem juntas e
respondeu 400 para uma requisição sem `songs`.

## O que mudou na migração

- `ml-service/main.py` não rodava: `OUTPUT_FILE = ''/app/data/playlist_rules.pkl''` é
  erro de sintaxe em Python. Corrigido para uma string só.
- `frontend-service/api.py` criava o `Flask(__name__)` duas vezes; ficou uma.
- `watch-client.sh` tinha o IP interno do cluster e uma porta inválida (`30502:48996/TCP`);
  agora `IP`, `PORTA` e `MUSICA_URI` vêm de variáveis de ambiente.
- Ficaram de fora os dados (~80 MB), o modelo treinado (~43 MB), um *dump* do objeto
  `Application` do Argo CD tirado com `kubectl` (cheio de campos gerados pelo cluster), um
  Job de teste "hello world" e arquivos temporários.
- Observação: `k8s/frontend-deployment.yaml` ainda usa a imagem `nginx:latest` como
  marcador, com o volume do modelo comentado; para servir a API, troque pela imagem do
  `frontend-service` e descomente a montagem do PVC.

## Versão evoluída

Este é o trabalho como entregue na disciplina. Uma reescrita completa, com FastAPI, troca
de modelo a quente, artefatos no S3, Helm, Argo CD, Prometheus e testes de ponta a ponta
num cluster `kind` na CI, está em
[`davifmn/playlist-recommender`](https://github.com/davifmn/playlist-recommender).

---
Autor: Davi Fraga · migrado de [`davifmn/recomender`](https://github.com/davifmn/recomender)
