# 1. Usar a imagem base Python recomendada
FROM python:3.9-slim-bullseye

# 2. Definir o diretório de trabalho dentro do container
WORKDIR /app

# 3. Copiar o arquivo de dependências
COPY requirements.txt .

# 4. Instalar as dependências
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar o script principal
COPY main.py .

# 6. Definir "volumes" que esperamos que sejam "montados" (fornecidos)
# O /data é de onde leremos os .csv
# O /model é onde salvaremos o .pkl
VOLUME /data
VOLUME /model

# 7. O comando padrão para executar quando o container iniciar
# Vamos assumir que o main.py será modificado para usar os caminhos /data e /model
CMD ["python", "main.py"]