FROM node:6.9.5-onbuild

# Install lapack
RUN apt-get update
RUN apt-get install -y liblapacke liblapack-dev

# Create watcher script
RUN npm install -g nodemon
RUN echo '#!/bin/sh \n\
nodemon -w /sylv -x "cp -R /sylv/src /usr/src/app \
    && cp -R /sylv/test /usr/src/app \
    && cd /usr/src/app \
    && npm test \
    && cp /usr/src/app/doc/gen/examples.json /sylv/doc/gen" \
' > /bin/watch
RUN chmod +x /bin/watch
