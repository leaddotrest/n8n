import { INodeCredentials, INodeParameters, MessageEventBusDestinationOptions } from "n8n-workflow";
import { INodeUi } from "../../Interface";

export function destinationToFakeINodeUi(destination: MessageEventBusDestinationOptions, fakeType = 'n8n-nodes-base.httpRequest'): INodeUi {
	return {
		id: destination.id,
		name: destination.id,
		typeVersion: 1,
		type: fakeType,
		position: [0, 0],
		credentials: {
			...destination.credentials as INodeCredentials,
		},
		parameters: {
			...destination as unknown as INodeParameters,
		},
	} as INodeUi;
}
