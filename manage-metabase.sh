#!/bin/bash

METABASE_DIR="/opt/metabase"

case "$1" in
    start)
        echo "Starting Metabase..."
        cd $METABASE_DIR
        sudo docker-compose up -d
        echo "Metabase started!"
        ;;
    stop)
        echo "Stopping Metabase..."
        cd $METABASE_DIR
        sudo docker-compose down
        echo "Metabase stopped!"
        ;;
    restart)
        echo "Restarting Metabase..."
        cd $METABASE_DIR
        sudo docker-compose restart
        echo "Metabase restarted!"
        ;;
    logs)
        echo "Showing Metabase logs..."
        cd $METABASE_DIR
        sudo docker-compose logs -f metabase
        ;;
    status)
        echo "Metabase status:"
        cd $METABASE_DIR
        sudo docker-compose ps
        ;;
    backup)
        echo "Creating backup..."
        cd $METABASE_DIR
        sudo docker-compose exec postgres pg_dump -U metabase metabase > backup_$(date +%Y%m%d_%H%M%S).sql
        echo "Backup created!"
        ;;
    update)
        echo "Updating Metabase..."
        cd $METABASE_DIR
        sudo docker-compose pull
        sudo docker-compose up -d
        echo "Metabase updated!"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|backup|update}"
        exit 1
        ;;
esac 