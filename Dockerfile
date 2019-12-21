FROM node:6.9.5-onbuild

# Install lapack
RUN apt-get update
RUN apt-get install -y liblapacke liblapack-dev

# Create watcher script
RUN npm install -g nodemon
RUN echo '#!/bin/sh \n\
cd /usr/src/app \n\
nodemon -L --watch /sylv/test --watch /sylv/src -x "cp -R /sylv/src . \
    && cp -R /sylv/test . \
    && npm test \
    && cp /usr/src/app/doc/gen/examples.json /sylv/doc/gen" \
' > /bin/watch
RUN chmod +x /bin/watch
