#!/usr/bin/env bash
fsroot=${FSROOT:-.}
export FSENV=${FSENV:-.local}
export PYTHONPATH=${fsroot}/lib:$PYTHONPATH

# this is needed on MacOS
export LD_LIBRARY_PATH=/usr/local/mysql/lib

RETVAL=0

PROG=sixserver
TAC=${fsroot}/tac/sixserver.tac
LOG=${fsroot}/log/sixserver.log
PID=${fsroot}/log/sixserver.pid

case "$1" in
    run)
        # Ensure sixserver.yaml exists (copy from example if needed)
        if [ ! -f ${fsroot}/etc/conf/sixserver.yaml ]; then
            echo "Creating sixserver.yaml from example..."
            cp ${fsroot}/etc/conf/sixserver.yaml.example ${fsroot}/etc/conf/sixserver.yaml
        fi
        ${FSENV}/bin/python3 ${fsroot}/update_config.py
        ${FSENV}/bin/twistd -noy $TAC
        ;;
    runexec)
        rm -f $PID
        # Ensure sixserver.yaml exists (copy from example if needed)
        if [ ! -f ${fsroot}/etc/conf/sixserver.yaml ]; then
            echo "Creating sixserver.yaml from example..."
            cp ${fsroot}/etc/conf/sixserver.yaml.example ${fsroot}/etc/conf/sixserver.yaml
        fi
        ${FSENV}/bin/python3 ${fsroot}/update_config.py
        exec ${FSENV}/bin/twistd -noy $TAC --logfile $LOG --pidfile $PID
        ;;
    start)
        ${FSENV}/bin/twistd -y $TAC --logfile $LOG --pidfile $PID
        ;;
    stop)
        cat $PID | xargs kill
        ;;
    status)
        if [ -f $PID ]; then
            pid=`cat $PID`
            ps $pid >/dev/null 2>&1
            if [ $? = 0 ]; then
                echo "$PROG ($pid) is running ..."
            else
                echo "$PROG is not running but pid-file exists"
                RETVAL=1
            fi
        else
            echo "$PROG is stopped"
        fi
        ;;
    *)
        echo "Usage $0 {run|runexec|start|stop|status}"
        RETVAL=3
esac

exit $RETVAL
