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
RUN apt update && apt install vi
USER user

CMD /home/user/main_loop.sh
