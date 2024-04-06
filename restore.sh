set -e

RED="\x1b[38;5;9m"
BLUE="\x1b[38;5;6m"
YELLOW="\x1b[38;5;3m"
GRAY="\x1b[38;5;8m"
GREEN="\x1b[38;5;2m"
RESET="\x1b[0m"

print_log() {
    local log_level=$2
    case $log_level in
        "DEBUG")
            COLOR=$GRAY;;
        "INFO")
            COLOR=$BLUE;;
        "WARNING")
            COLOR=$YELLOW;;
        "ERROR")
            COLOR=$RED;;
        *)
            COLOR=;;
    esac
    echo -e "[${COLOR}${log_level}${RESET}] ${COLOR}$1${RESET}"
}

if [ ! -f .env ]; then
    print_log "File .env must exist to execute this script" "ERROR"
    exit -1
fi

. .env

if [ -n "$2" ]; then
    CONTAINER_ID="$2"
else
    CONTAINER_ID=rankingdatamanagement-mongo-1
fi

docker exec -i ${CONTAINER_ID} sh -c 'mongorestore -u '${MONGO_USERNAME}' -p '${MONGO_PASSWORD}' --archive --gzip' < $1
