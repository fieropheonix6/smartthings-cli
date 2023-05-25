import { Interfaces } from '@oclif/core'
import inquirer from 'inquirer'

import { Profile } from '../../cli-config.js'
import { cancelAction, editAction, finishAction, previewJSONAction, previewYAMLAction } from '../../item-input/defs.js'
import { createFromUserInput, updateFromUserInput } from '../../item-input/command-helpers.js'
import * as commandHelpers from '../../item-input/command-helpers.js'
import { jsonFormatter, yamlFormatter } from '../../output.js'
import { SmartThingsCommandInterface } from '../../smartthings-command.js'


jest.mock('inquirer')
jest.mock('../../output')

const promptMock = jest.mocked(inquirer.prompt)

const cancelMock = jest.fn().mockImplementation(() => { throw Error('canceled') })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildCommandMock = (flags: Interfaces.OutputFlags<any> = {}, profile: Profile = {}): SmartThingsCommandInterface =>
	({ flags, cliConfig: { profile }, cancel: cancelMock } as unknown as SmartThingsCommandInterface)
const commandMock = buildCommandMock()

const buildFromUserInputMock = jest.fn()
const summarizeForEditMock = jest.fn()
const updateFromUserInputMock = jest.fn()
const inputDefMock = {
	name: 'Item-to-Input',
	buildFromUserInput: buildFromUserInputMock,
	summarizeForEdit: summarizeForEditMock,
	updateFromUserInput: updateFromUserInputMock,
}
const jsonOutputFormatterMock = jest.fn().mockReturnValue('formatted JSON')
const yamlOutputFormatterMock = jest.fn().mockReturnValue('formatted YAML')
const jsonFormatterMock = jest.mocked(jsonFormatter).mockReturnValue(jsonOutputFormatterMock)
const yamlFormatterMock = jest.mocked(yamlFormatter).mockReturnValue(yamlOutputFormatterMock)

describe('updateFromUserInput', () => {
	it('returns input when no further updates requested', async () => {
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false }))
			.toStrictEqual('input value')

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
			message: 'Choose an action.',
			default: finishAction,
			choices: [
				{ name: 'Edit Item-to-Input.', value: editAction },
				{ name: 'Preview JSON.', value: expect.any(Symbol) },
				{ name: 'Preview YAML.', value: expect.any(Symbol) },
				{ name: 'Finish and update Item-to-Input.', value: finishAction },
				{ name: 'Cancel creating Item-to-Input.', value: cancelAction },
			],
		}))

		expect(buildFromUserInputMock).toHaveBeenCalledTimes(0)
		expect(summarizeForEditMock).toHaveBeenCalledTimes(0)
		expect(updateFromUserInputMock).toHaveBeenCalledTimes(0)
	})

	it('uses "output" text when in dry-run mode', async () => {
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: true }))
			.toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
			choices: expect.arrayContaining([
				{ name: 'Finish and output Item-to-Input.', value: finishAction },
			]),
		}))
	})

	it('uses specified finishVerb', async () => {
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false, finishVerb: 'run' }))
			.toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(1)
		expect(promptMock).toHaveBeenCalledWith(expect.objectContaining({
			choices: expect.arrayContaining([
				{ name: 'Finish and run Item-to-Input.', value: finishAction },
			]),
		}))
	})

	it('allows editing from main menu', async () => {
		promptMock.mockResolvedValueOnce({ action: editAction })
		updateFromUserInputMock.mockResolvedValueOnce('updated result')
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('updated result')

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(updateFromUserInputMock).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputMock).toHaveBeenCalledWith('input value')
	})

	it('accepts cancelation of editing from main menu', async () => {
		promptMock.mockResolvedValueOnce({ action: editAction })
		updateFromUserInputMock.mockResolvedValueOnce(cancelAction)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(2)
		expect(updateFromUserInputMock).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputMock).toHaveBeenCalledWith('input value')
	})

	it('allows previewing JSON', async () => {
		promptMock.mockResolvedValueOnce({ action: previewJSONAction })
		promptMock.mockResolvedValueOnce({ editAgain: false })
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonFormatterMock).toHaveBeenCalledWith(4)
		expect(jsonOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonOutputFormatterMock).toHaveBeenCalledWith('input value')
		expect(promptMock).toHaveBeenCalledWith({
			type: 'confirm',
			name: 'editAgain',
			message: 'formatted JSON\n\nWould you like to edit further?',
			default: false,
		})
	})

	it('allows editing after preview', async () => {
		promptMock.mockResolvedValueOnce({ action: previewJSONAction })
		promptMock.mockResolvedValueOnce({ editAgain: true })
		updateFromUserInputMock.mockResolvedValueOnce('updated result')
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('updated result')

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputMock).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputMock).toHaveBeenCalledWith('input value')
	})

	it('sticks to original upon cancelation after editing after preview', async () => {
		promptMock.mockResolvedValueOnce({ action: previewJSONAction })
		promptMock.mockResolvedValueOnce({ editAgain: true })
		updateFromUserInputMock.mockResolvedValueOnce(cancelAction)
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputMock).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputMock).toHaveBeenCalledWith('input value')
	})

	it('allows previewing YAML', async () => {
		promptMock.mockResolvedValueOnce({ action: previewYAMLAction })
		promptMock.mockResolvedValueOnce({ editAgain: false })
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(yamlFormatterMock).toHaveBeenCalledTimes(1)
		expect(yamlFormatterMock).toHaveBeenCalledWith(2)
		expect(yamlOutputFormatterMock).toHaveBeenCalledTimes(1)
		expect(yamlOutputFormatterMock).toHaveBeenCalledWith('input value')
		expect(promptMock).toHaveBeenCalledWith({
			type: 'confirm',
			name: 'editAgain',
			message: 'formatted YAML\n\nWould you like to edit further?',
			default: false,
		})
	})

	it('accepts indent level from config', async () => {
		const commandMock = buildCommandMock({}, { indent: 13 })
		promptMock.mockResolvedValueOnce({ action: previewYAMLAction })
		promptMock.mockResolvedValueOnce({ editAgain: false })
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(yamlFormatterMock).toHaveBeenCalledTimes(1)
		expect(yamlFormatterMock).toHaveBeenCalledWith(13)
		expect(yamlOutputFormatterMock).toHaveBeenCalledTimes(1)
	})

	it('accepts indent level from command line', async () => {
		const commandMock = buildCommandMock({ indent: 14 })
		promptMock.mockResolvedValueOnce({ action: previewJSONAction })
		promptMock.mockResolvedValueOnce({ editAgain: false })
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(jsonFormatterMock).toHaveBeenCalledTimes(1)
		expect(jsonFormatterMock).toHaveBeenCalledWith(14)
		expect(jsonOutputFormatterMock).toHaveBeenCalledTimes(1)
	})

	it('command line indent overrides value from config', async () => {
		const commandMock = buildCommandMock({ indent: 15 }, { indent: 14 })
		promptMock.mockResolvedValueOnce({ action: previewYAMLAction })
		promptMock.mockResolvedValueOnce({ editAgain: false })
		promptMock.mockResolvedValueOnce({ action: finishAction })

		expect(await updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).toBe('input value')

		expect(promptMock).toHaveBeenCalledTimes(3)
		expect(yamlFormatterMock).toHaveBeenCalledTimes(1)
		expect(yamlFormatterMock).toHaveBeenCalledWith(15)
		expect(yamlOutputFormatterMock).toHaveBeenCalledTimes(1)
	})

	it('calls cancel when user cancels', async () => {
		promptMock.mockResolvedValueOnce({ action: cancelAction })

		await expect(updateFromUserInput(commandMock, inputDefMock, 'input value', { dryRun: false })).rejects.toThrow('canceled')

		expect(cancelMock).toHaveBeenCalledTimes(1)
	})
})

describe('createFromUserInput', () => {
	it('calls buildFromUserInput and updateFromUserInput', async () => {
		const updateFromUserInputSpy = jest.spyOn(commandHelpers, 'updateFromUserInput')

		buildFromUserInputMock.mockResolvedValueOnce('wizard value')
		updateFromUserInputSpy.mockResolvedValueOnce({ value: 'updated value' })

		expect(await createFromUserInput(commandMock, inputDefMock, { dryRun: false })).toStrictEqual({ value: 'updated value' })

		expect(buildFromUserInputMock).toHaveBeenCalledTimes(1)
		expect(buildFromUserInputMock).toHaveBeenCalledWith()
		expect(updateFromUserInputSpy).toHaveBeenCalledTimes(1)
		expect(updateFromUserInputSpy).toHaveBeenCalledWith(commandMock, inputDefMock, 'wizard value',
			{ finishVerb: 'create', dryRun: false })
	})

	it('cancels when initial initial wizard mode is canceled', async () => {
		buildFromUserInputMock.mockReturnValueOnce(cancelAction)

		await expect(createFromUserInput(commandMock, inputDefMock, { dryRun: false })).rejects.toThrow('canceled')

		expect(buildFromUserInputMock).toHaveBeenCalledTimes(1)
		expect(cancelMock).toHaveBeenCalledTimes(1)
	})
})
