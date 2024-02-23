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

CMD /home/user/main_loop.sh
