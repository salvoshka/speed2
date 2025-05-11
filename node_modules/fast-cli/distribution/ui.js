import dns from 'node:dns/promises';
import React, { useState, useEffect } from 'react';
import { Box, Text, Newline, useApp, useStdout, } from 'ink';
import Spinner from 'ink-spinner';
import api from './api.js';
import { convertToMbps } from './utilities.js';
const FixedSpacer = ({ size }) => React.createElement(React.Fragment, null, ' '.repeat(size));
const ErrorMessage = ({ text }) => (React.createElement(Box, null,
    React.createElement(Text, { bold: true, color: 'red' },
        "\u203A",
        React.createElement(FixedSpacer, { size: 1 })),
    React.createElement(Text, { dimColor: true }, text),
    React.createElement(Newline, { count: 2 })));
const Spacer = ({ singleLine }) => {
    if (singleLine) {
        return null;
    }
    return (React.createElement(Text, null,
        React.createElement(Newline, { count: 1 })));
};
const DownloadSpeed = ({ isDone, downloadSpeed, uploadSpeed, downloadUnit }) => {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const color = (isDone || uploadSpeed) ? 'green' : 'cyan';
    return (React.createElement(Text, { color: color },
        downloadSpeed,
        React.createElement(FixedSpacer, { size: 1 }),
        React.createElement(Text, { dimColor: true }, downloadUnit),
        React.createElement(FixedSpacer, { size: 1 }),
        "\u2193"));
};
const UploadSpeed = ({ isDone, uploadSpeed, uploadUnit }) => {
    const color = isDone ? 'green' : 'cyan';
    if (uploadSpeed) {
        return (React.createElement(Text, { color: color },
            uploadSpeed,
            React.createElement(Text, { dimColor: true }, ` ${uploadUnit} ↑`)));
    }
    return React.createElement(Text, { dimColor: true, color: color }, ' - Mbps ↑');
};
const Speed = ({ upload, data }) => upload ? (React.createElement(React.Fragment, null,
    React.createElement(DownloadSpeed, { ...data }),
    React.createElement(Text, { dimColor: true }, ' / '),
    React.createElement(UploadSpeed, { ...data }))) : (React.createElement(DownloadSpeed, { ...data }));
const Ui = ({ singleLine, upload, json }) => {
    const [error, setError] = useState('');
    const [data, setData] = useState({});
    const [isDone, setIsDone] = useState(false);
    const { exit } = useApp();
    const { write } = useStdout();
    useEffect(() => {
        (async () => {
            try {
                await dns.lookup('fast.com');
            }
            catch (error) {
                setError(error.code === 'ENOTFOUND'
                    ? 'Please check your internet connection'
                    : `Something happened ${JSON.stringify(error)}`);
                exit();
                return;
            }
            try {
                for await (const result of api({ measureUpload: upload })) {
                    // @ts-expect-error - Don't have time to look into it.
                    setData(result);
                }
            }
            catch (error) {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
                setError(error.message ?? `${error ?? '<Unknown error>'}`);
                exit();
            }
        })();
    }, [exit, upload]);
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        if (data.isDone || (!upload && data.uploadSpeed)) {
            setIsDone(true);
        }
    }, [data.isDone, upload, data.uploadSpeed]);
    useEffect(() => {
        if (!isDone) {
            return;
        }
        if (json) {
            const jsonData = {
                ...data,
                downloadSpeed: convertToMbps(data.downloadSpeed, data.downloadUnit),
                uploadSpeed: upload ? convertToMbps(data.uploadSpeed, data.uploadUnit) : undefined,
                downloadUnit: undefined,
                uploadUnit: upload ? undefined : data.uploadUnit,
                isDone: undefined, // Explicitly omit 'isDone'
            };
            write(JSON.stringify(jsonData, (_key, value) => 
            // Exclude keys with undefined values from serialization.
            value === undefined ? undefined : value, // eslint-disable-line @typescript-eslint/no-unsafe-return
            '\t'));
        }
        exit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDone, exit]);
    if (error) {
        return React.createElement(ErrorMessage, { text: error });
    }
    if (json) {
        return null;
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(Spacer, { singleLine: singleLine }),
        React.createElement(Box, null,
            !isDone && (React.createElement(React.Fragment, null,
                !singleLine && React.createElement(Text, null,
                    React.createElement(FixedSpacer, { size: 2 })),
                React.createElement(Text, { color: 'cyan' },
                    React.createElement(Spinner, null)),
                React.createElement(Text, null,
                    React.createElement(FixedSpacer, { size: 1 })))),
            isDone && React.createElement(Text, null,
                React.createElement(FixedSpacer, { size: 4 })),
            Object.keys(data).length > 0 && React.createElement(Speed, { upload: upload, data: data })),
        React.createElement(Spacer, { singleLine: singleLine })));
};
export default Ui;
