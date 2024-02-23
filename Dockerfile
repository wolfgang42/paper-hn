FROM node

RUN npm install http-server -g

RUN adduser user
USER user


USER user
WORKDIR /home/user
COPY . .
RUN yarn install --modules-folder=/home/user/node_modules
COPY /scripts/main_loop.sh .

USER root
RUN apt update && DEBIAN_FRONTEND=noninteractive apt-get install --yes vim
RUN chown -R user:user .
USER user

HEALTHCHECK CMD curl --fail 127.0.0.1:8080 || exit 1

CMD /home/user/main_loop.sh
