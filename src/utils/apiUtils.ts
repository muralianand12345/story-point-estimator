const isPromise = <T>(value: any): value is Promise<T> => {
    return Boolean(value && typeof value.then === 'function');
};

const getParamId = async (param: string | Promise<string> | undefined | null): Promise<string | null> => {
    if (param === null || param === undefined) {
        return null;
    }

    if (isPromise<string>(param)) {
        return await param;
    }

    return param;
};

export { getParamId, isPromise };