export interface IContext {
    params: {
        id: Promise<string>;
        participantsId?: Promise<string>;
    };
}