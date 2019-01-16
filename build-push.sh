docker build . -t us.gcr.io/multichain-prod/emblemhd:v1 $1
gcloud docker -- push us.gcr.io/multichain-prod/emblemhd:v1