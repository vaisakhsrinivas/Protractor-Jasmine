var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "should display documents pages on successful login|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/ - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606493489657,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://agileupstream.auth0.com/favicon.ico - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606493504851,
                "type": ""
            }
        ],
        "timestamp": 1606493491121,
        "duration": 13788
    },
    {
        "description": "navigate to uploads page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606493505033,
        "duration": 762
    },
    {
        "description": "click upload zone|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606493505810,
        "duration": 2315
    },
    {
        "description": "Upload File and add related information|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/uploads - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606493508291,
                "type": ""
            }
        ],
        "timestamp": 1606493508152,
        "duration": 5436
    },
    {
        "description": "Navigate back to documents page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606493513599,
        "duration": 5221
    },
    {
        "description": "Refresh the documents page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606493518845,
        "duration": 5121
    },
    {
        "description": "Check for uploaded document|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606493524018,
        "duration": 16574
    },
    {
        "description": "apply fact value on uploaded document & check toast message|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606493540604,
        "duration": 16216
    },
    {
        "description": "verify fact value is applied to the document|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://app.thoughttrace.dev/main.f422085fa36871109945.js 0:1471973 \"Document is not loaded yet!!!. Try to set page# after full load. Ignore this warning if you are not setting page# using '.' notation. (E.g. pdfViewer.page = 5;)\"",
                "timestamp": 1606493566911,
                "type": ""
            }
        ],
        "timestamp": 1606493556840,
        "duration": 16552
    },
    {
        "description": "close the document expand window|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606493573411,
        "duration": 5296
    },
    {
        "description": "apply & verify fact filter|verify user can apply fact and tags filter",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/documents - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606493578905,
                "type": ""
            }
        ],
        "timestamp": 1606493579419,
        "duration": 11596
    },
    {
        "description": "apply & verify tag filter|verify user can apply fact and tags filter",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62024,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606493591032,
        "duration": 13511
    },
    {
        "description": "should display documents pages on successful login|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/ - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606493987005,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://agileupstream.auth0.com/favicon.ico - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606494002671,
                "type": ""
            }
        ],
        "timestamp": 1606493988764,
        "duration": 13955
    },
    {
        "description": "navigate to uploads page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606494002802,
        "duration": 1071
    },
    {
        "description": "click upload zone|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606494003889,
        "duration": 3113
    },
    {
        "description": "Upload File and add related information|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/uploads - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606494007159,
                "type": ""
            }
        ],
        "timestamp": 1606494007018,
        "duration": 6121
    },
    {
        "description": "Navigate back to documents page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606494013152,
        "duration": 5237
    },
    {
        "description": "Refresh the documents page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606494018406,
        "duration": 5129
    },
    {
        "description": "Check for uploaded document|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606494023599,
        "duration": 16588
    },
    {
        "description": "apply fact value on uploaded document & check toast message|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606494040203,
        "duration": 16134
    },
    {
        "description": "verify fact value is applied to the document|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://app.thoughttrace.dev/main.f422085fa36871109945.js 0:1471973 \"Document is not loaded yet!!!. Try to set page# after full load. Ignore this warning if you are not setting page# using '.' notation. (E.g. pdfViewer.page = 5;)\"",
                "timestamp": 1606494066418,
                "type": ""
            }
        ],
        "timestamp": 1606494056352,
        "duration": 15574
    },
    {
        "description": "close the document expand window|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606494071940,
        "duration": 5333
    },
    {
        "description": "apply & verify fact filter|verify user can apply fact and tags filter",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/documents - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606494077464,
                "type": ""
            }
        ],
        "timestamp": 1606494077923,
        "duration": 11844
    },
    {
        "description": "apply & verify tag filter|verify user can apply fact and tags filter",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62136,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606494089789,
        "duration": 13503
    },
    {
        "description": "should display documents pages on successful login|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/ - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606505925890,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://agileupstream.auth0.com/favicon.ico - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606505941198,
                "type": ""
            }
        ],
        "timestamp": 1606505927665,
        "duration": 13568
    },
    {
        "description": "navigate to uploads page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606505941313,
        "duration": 676
    },
    {
        "description": "click upload zone|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606505942006,
        "duration": 3507
    },
    {
        "description": "Upload File and add related information|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/uploads - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606505945657,
                "type": ""
            }
        ],
        "timestamp": 1606505945528,
        "duration": 5556
    },
    {
        "description": "Navigate back to documents page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606505951099,
        "duration": 5203
    },
    {
        "description": "Refresh the documents page|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606505956332,
        "duration": 5107
    },
    {
        "description": "Check for uploaded document|verify user can upload document with tags",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606505961526,
        "duration": 16573
    },
    {
        "description": "apply fact value on uploaded document & check toast message|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606505978113,
        "duration": 16409
    },
    {
        "description": "verify fact value is applied to the document|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://app.thoughttrace.dev/main.f422085fa36871109945.js 0:1471973 \"Document is not loaded yet!!!. Try to set page# after full load. Ignore this warning if you are not setting page# using '.' notation. (E.g. pdfViewer.page = 5;)\"",
                "timestamp": 1606506004601,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/assets/pdfjs/build/pdf.js 19199:30 Uncaught Error: TextLayer task cancelled.",
                "timestamp": 1606506011107,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/assets/pdfjs/build/pdf.js 19199:30 Uncaught Error: TextLayer task cancelled.",
                "timestamp": 1606506011107,
                "type": ""
            }
        ],
        "timestamp": 1606505994537,
        "duration": 16605
    },
    {
        "description": "close the document expand window|verify user can apply fact value to single document using bulk update",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed",
        "browserLogs": [],
        "timestamp": 1606506011157,
        "duration": 5302
    },
    {
        "description": "apply & verify fact filter|verify user can apply fact and tags filter",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://app.thoughttrace.dev/qa/documents - Failed to load resource: the server responded with a status of 404 ()",
                "timestamp": 1606506016613,
                "type": ""
            }
        ],
        "timestamp": 1606506017117,
        "duration": 11665
    },
    {
        "description": "apply & verify tag filter|verify user can apply fact and tags filter",
        "passed": true,
        "pending": false,
        "os": "Mac OS X",
        "instanceId": 62798,
        "browser": {
            "name": "chrome",
            "version": "87.0.4280.67"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "timestamp": 1606506028801,
        "duration": 13531
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
