import { APIOrganizationCommand, inputAndOutputItem } from '@smartthings/cli-lib'
import { PreferenceLocalization } from '@smartthings/core-sdk'
import { chooseDevicePreference } from '../../../lib/commands/devicepreferences-util.js'
import { tableFieldDefinitions } from '../../../lib/commands/devicepreferences/translations-util.js'


export default class DevicePreferencesTranslationsUpdateCommand extends APIOrganizationCommand<typeof DevicePreferencesTranslationsUpdateCommand.flags> {
	static description = 'update a device preference translation'

	static flags = {
		...APIOrganizationCommand.flags,
		...inputAndOutputItem.flags,
	}

	static args = [{
		name: 'preferenceId',
		description: 'device preference id or index',
	}]

	static examples = [
		{
			description: 'select a translation from a list and update it with the data in the file preferenceTranslation.json',
			command: 'smartthings devicepreferences:translations:update -i preferenceTranslation.json',
		},
	]

	async run(): Promise<void> {
		const preferenceId = await chooseDevicePreference(this, this.args.preferenceId)

		await inputAndOutputItem<PreferenceLocalization, PreferenceLocalization>(this, { tableFieldDefinitions },
			(_, translation) => this.client.devicePreferences.updateTranslations(preferenceId, translation))
	}
}
