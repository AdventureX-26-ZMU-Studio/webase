FROM node:22

RUN apt-get update && apt-get install -y wget openssh-server && rm -rf /var/lib/apt/lists/*

RUN npm install -g wrangler

RUN mkdir -p /ide_cnb

RUN wget -q https://download.jetbrains.com/webstorm/WebStorm-2025.2.5.tar.gz \
    && tar -zxf WebStorm-2025.2.5.tar.gz -C /ide_cnb \
    && rm WebStorm-2025.2.5.tar.gz

ENV LANG C.UTF-8
