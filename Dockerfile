FROM node

RUN npm install http-server -g

RUN adduser user
USER user


USER user
WORKDIR /home/user
RUN yarn install --modules-folder=/home/user/node_modules
COPY . .
COPY /scripts/main_loop.sh .

CMD /home/user/main_loop.sh
