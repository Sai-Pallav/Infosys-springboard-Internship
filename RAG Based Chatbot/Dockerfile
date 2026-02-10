# Use an official Python runtime as a parent image (so we have Python & Pip)
# We use a slim version to keep it small, but with enough tools
FROM python:3.10-slim

# Install Node.js
# We use curl to setup the nodejs repository
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the entire project
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r code_Files/requirements.txt

# Install Node.js dependencies
WORKDIR /usr/src/app/server
RUN npm install

# Expose the API port
EXPOSE 5000

# Set environment variables (Render will provide strict ones, but these are defaults)
ENV PORT=5000
ENV PYTHON_PATH=python3

# Start the server
CMD ["node", "index.js"]
