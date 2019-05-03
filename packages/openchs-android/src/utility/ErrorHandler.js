import StackTrace from 'stacktrace-js';
import bugsnag from './bugsnag';
import Config from 'react-native-config';
import General from "./General";

export default class ErrorHandler {
    static set(errorCallback) {
        if (Config.ENV !== 'dev') {
            ErrorUtils.setGlobalHandler((error, isFatal) => {
                ErrorHandler.postError(error, isFatal, errorCallback);
            });
        }
    }

    static setUser(username) {
        bugsnag.setUser(username, username, username);
    }

    static postError(error, isFatal, errorCallback) {
        General.logDebug('ErrorHandler',`IsFatal=${isFatal} ${error}`);
        General.logDebug('ErrorHandler', error);
        error.message = `${isFatal ? 'Fatal' : 'Non-fatal'} error: ${error.message}`;

        if (isFatal) {
            StackTrace.fromError(error, {offline: true})
                .then((x) => {
                    General.logDebug('ErrorHandler', `Creating frame array`);
                    const frameArray = x.map((row) => Object.defineProperty(row, 'fileName', {
                        value: `${row.fileName}:${row.lineNumber || 0}:${row.columnNumber || 0}`
                    }));
                    General.logDebug('ErrorHandler', `Notifying Bugsnag ${error}`);
                    bugsnag.notify(error, (report) => report.metadata.frameArray = frameArray);
                    General.logDebug('ErrorHandler', `Restarting app.`);
                    errorCallback(error, JSON.stringify(frameArray));
                });
        } else {
            bugsnag.notify(error);
        }
    }
}