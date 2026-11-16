# 1. Usar a mesma imagem base
FROM python:3.9-slim-bullseye

# 2. Definir o diretório de trabalho
WORKDIR /app

# 3. Definir a variável de ambiente para o Flask
ENV FLASK_APP=api

# 4. Copiar e instalar as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar o script da API
COPY api.py .

# 6. Definir o volume de onde o modelo será lido
VOLUME /model

# 7. Expor a porta 5000 (porta padrão do Flask)
EXPOSE 5000

# 8. O comando para iniciar o servidor
# --host=0.0.0.0 torna o servidor acessível de fora do container
CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]