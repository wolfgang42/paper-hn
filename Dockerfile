FROM node

RUN adduser user
USER user


USER user
WORKDIR /home/user
COPY . .
RUN yarn install --modules-folder=/home/user/node_modules
COPY /scripts/main_loop.sh .
COPY /scripts/harden.sh .

USER root
RUN apt update && DEBIAN_FRONTEND=noninteractive apt-get install --yes nginx

ENV TZ=Europe/Vienna
ENV LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8

COPY nginx.conf /etc/nginx/nginx.conf
RUN mkdir -p /var/lib/nginx
RUN chown -R user:user /var/lib/nginx
RUN chown -R user:user /var/log/nginx
RUN chown -R user:user .

RUN touch /run/nginx.pid && chown -R user:user /run/nginx.pid

RUN ./harden.sh user
USER user

CMD /home/user/main_loop.sh
