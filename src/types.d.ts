export interface IContext {
    params: {
        id: Promise<string>;
        participantId?: Promise<string>;
    };
}