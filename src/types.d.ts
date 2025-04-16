export interface IContext {
	params: Promise<{
		id: string;
		participantsId?: string;
	}>;
}
