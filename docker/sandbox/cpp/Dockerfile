FROM alpine:3.20

RUN apk add --no-cache g++

WORKDIR /sandbox

RUN adduser -D runner

USER runner

CMD ["sh"]