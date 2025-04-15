export interface IContext {
    params: {
        id: string | Promise<string>;
        participantId: string | Promise<string>;
    };
}