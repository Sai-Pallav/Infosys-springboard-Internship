FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r python_engine/requirements.txt

# Set up the server (Root is already /server)
RUN npm install

EXPOSE 3000
ENV PORT=3000
ENV PYTHON_PATH=python3
ENV NODE_ENV=production

CMD ["node", "index.js"]