FROM node:14.12

RUN apt-get update
RUN npm install http-server -g
RUN git clone https://github.com/wolfgang42/paper-hn.git

WORKDIR /paper-hn
RUN yarn install

COPY /scripts/main_loop.sh .

CMD /paper-hn/main_loop.sh
