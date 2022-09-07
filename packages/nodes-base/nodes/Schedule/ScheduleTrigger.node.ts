import { ITriggerFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	NodeOperationError,
	toCronExpression,
	TriggerTime,
} from 'n8n-workflow';

import { CronJob } from 'cron';
import { ICronExpression } from './CronInterface';
import moment from 'moment';

export class ScheduleTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Schedule Trigger',
		name: 'scheduleTrigger',
		icon: 'file:schedule.svg',
		group: ['trigger', 'schedule'],
		version: 1,
		description: 'Triggers the workflow in a given schedule',
		eventTriggerDescription: '',
		activationMessage:
			'Your schedule trigger will now trigger executions on the schedule you have defined.',
		defaults: {
			name: 'Schedule Trigger',
			color: '#00FF00',
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Add Rule',
				name: 'rule',
				type: 'fixedCollection',
				default: {},
				options: [
					{
						displayName: 'Seconds',
						name: 'seconds',
						values: [
							{
								name: 'value',
								displayName: 'Seconds Between Triggers',
								type: 'number',
								default: 30,
								description: 'Interval value',
							},
						],
					},
					{
						displayName: 'Minutes',
						name: 'minutes',
						values: [
							{
								name: 'value',
								displayName: 'Minutes Between Triggers',
								type: 'number',
								default: 5,
								description: 'Interval value',
							},
						],
					},
					{
						displayName: 'Hours',
						name: 'hours',
						values: [
							{
								name: 'value',
								displayName: 'Hours Between Triggers',
								type: 'number',
								default: 1,
								description: 'Interval value',
							},
							{
								name: 'triggerAtMinute',
								displayName: 'Trigger at Minute',
								type: 'number',
								default: 0,
								typeOptions: {
									minValue: 0,
									maxValue: 59,
								},
								description: 'The minute past the hour to trigger (0-59)',
							},
						],
					},
					{
						displayName: 'Days',
						name: 'days',
						default: 1,
						values: [
							{
								name: 'value',
								displayName: 'Days Between Triggers',
								type: 'number',
								default: 1,
								description: 'Interval value',
							},
							{
								name: 'triggerAtHour',
								displayName: 'Trigger at Hour',
								type: 'options',
								default: 0,
								options: [
									{
										name: 'Midnight',
										displayName: 'Midnight',
										value: 0,
									},
									{
										name: '1am',
										displayName: '1am',
										value: 1,
									},
									{
										name: '2am',
										displayName: '2am',
										value: 2,
									},
									{
										name: '3am',
										displayName: '3am',
										value: 3,
									},
									{
										name: '4am',
										displayName: '4am',
										value: 4,
									},
									{
										name: '5am',
										displayName: '5am',
										value: 5,
									},
									{
										name: '6am',
										displayName: '6am',
										value: 6,
									},
									{
										name: '7am',
										displayName: '7am',
										value: 7,
									},
									{
										name: '8am',
										displayName: '8am',
										value: 8,
									},
									{
										name: '9am',
										displayName: '9am',
										value: 9,
									},
									{
										name: '10am',
										displayName: '10am',
										value: 10,
									},
									{
										name: '11am',
										displayName: '11am',
										value: 11,
									},
									{
										name: 'Noon',
										displayName: 'Noon',
										value: 12,
									},
									{
										name: '1pm',
										displayName: '1pm',
										value: 13,
									},
									{
										name: '2pm',
										displayName: '2pm',
										value: 14,
									},
									{
										name: '3pm',
										displayName: '3pm',
										value: 15,
									},
									{
										name: '4pm',
										displayName: '4pm',
										value: 16,
									},
									{
										name: '5pm',
										displayName: '5pm',
										value: 17,
									},
									{
										name: '6pm',
										displayName: '6pm',
										value: 18,
									},
									{
										name: '7pm',
										displayName: '7pm',
										value: 19,
									},
									{
										name: '8pm',
										displayName: '8pm',
										value: 20,
									},
									{
										name: '9pm',
										displayName: '9pm',
										value: 21,
									},
									{
										name: '10pm',
										displayName: '10pm',
										value: 22,
									},
									{
										name: '11pm',
										displayName: '11pm',
										value: 23,
									},
								],
								description: 'The hour of the day to trigger',
							},
							{
								name: 'triggerAtMinute',
								displayName: 'Trigger at Minute',
								type: 'number',
								default: 0,
								typeOptions: {
									minValue: 0,
									maxValue: 59,
								},
								description: 'The minute past the hour to trigger (0-59)',
							},
						],
					},
					{
						displayName: 'Weeks',
						name: 'weeks',
						type: 'number',
						default: 0,
						values: [
							{
								name: 'value',
								displayName: 'Weeks Between Triggers',
								type: 'number',
								default: 1,
								description: 'Interval value',
							},
							{
								name: 'triggerAtDay',
								displayName: 'Trigger on Weekdays',
								type: 'multiOptions',
								typeOptions: {
									maxValue: 7,
								},
								options: [
									{
										name: 'Friday',
										value: 5,
									},
									{
										name: 'Monday',
										value: 1,
									},
									{
										name: 'Saturday',
										value: 6,
									},
									{
										name: 'Sunday',
										value: 7,
									},
									{
										name: 'Thursday',
										value: 4,
									},
									{
										name: 'Tuesday',
										value: 2,
									},
									{
										name: 'Wednesday',
										value: 3,
									},
								],
								default: [7],
							},
							{
								name: 'triggerAtHour',
								displayName: 'Trigger at Hour',
								type: 'options',
								default: 0,
								options: [
									{
										name: 'Midnight',
										displayName: 'Midnight',
										value: 0,
									},
									{
										name: '1am',
										displayName: '1am',
										value: 1,
									},
									{
										name: '2am',
										displayName: '2am',
										value: 2,
									},
									{
										name: '3am',
										displayName: '3am',
										value: 3,
									},
									{
										name: '4am',
										displayName: '4am',
										value: 4,
									},
									{
										name: '5am',
										displayName: '5am',
										value: 5,
									},
									{
										name: '6am',
										displayName: '6am',
										value: 6,
									},
									{
										name: '7am',
										displayName: '7am',
										value: 7,
									},
									{
										name: '8am',
										displayName: '8am',
										value: 8,
									},
									{
										name: '9am',
										displayName: '9am',
										value: 9,
									},
									{
										name: '10am',
										displayName: '10am',
										value: 10,
									},
									{
										name: '11am',
										displayName: '11am',
										value: 11,
									},
									{
										name: 'Noon',
										displayName: 'Noon',
										value: 12,
									},
									{
										name: '1pm',
										displayName: '1pm',
										value: 13,
									},
									{
										name: '2pm',
										displayName: '2pm',
										value: 14,
									},
									{
										name: '3pm',
										displayName: '3pm',
										value: 15,
									},
									{
										name: '4pm',
										displayName: '4pm',
										value: 16,
									},
									{
										name: '5pm',
										displayName: '5pm',
										value: 17,
									},
									{
										name: '6pm',
										displayName: '6pm',
										value: 18,
									},
									{
										name: '7pm',
										displayName: '7pm',
										value: 19,
									},
									{
										name: '8pm',
										displayName: '8pm',
										value: 20,
									},
									{
										name: '9pm',
										displayName: '9pm',
										value: 21,
									},
									{
										name: '10pm',
										displayName: '10pm',
										value: 22,
									},
									{
										name: '11pm',
										displayName: '11pm',
										value: 23,
									},
								],
								description: 'The hour of the day to trigger',
							},
							{
								name: 'triggerAtMinute',
								displayName: 'Trigger at Minute',
								type: 'number',
								default: 0,
								description: 'The minute past the hour to trigger (0-59)',
							},
						],
					},
					{
						displayName: 'Months',
						name: 'months',
						type: 'number',
						default: 1,
						values: [
							{
								name: 'value',
								displayName: 'Months Between Triggers',
								type: 'number',
								default: 1,
								description: 'Would run every month unless specified otherwise',
							},
							{
								name: 'triggerAtDayOfMonth',
								displayName: 'Trigger at Day of Month',
								type: 'number',
								typeOptions: {
									minValue: 1,
									maxValue: 31,
								},
								default: 1,
								description: 'The day of the month to trigger (1-31)',
								hint: 'Will run on the last day of the month if there aren"t enough days in the month',
							},
							{
								name: 'triggerAtHour',
								displayName: 'Trigger at Hour',
								type: 'options',
								default: 0,
								options: [
									{
										name: 'Midnight',
										displayName: 'Midnight',
										value: 0,
									},
									{
										name: '1am',
										displayName: '1am',
										value: 1,
									},
									{
										name: '2am',
										displayName: '2am',
										value: 2,
									},
									{
										name: '3am',
										displayName: '3am',
										value: 3,
									},
									{
										name: '4am',
										displayName: '4am',
										value: 4,
									},
									{
										name: '5am',
										displayName: '5am',
										value: 5,
									},
									{
										name: '6am',
										displayName: '6am',
										value: 6,
									},
									{
										name: '7am',
										displayName: '7am',
										value: 7,
									},
									{
										name: '8am',
										displayName: '8am',
										value: 8,
									},
									{
										name: '9am',
										displayName: '9am',
										value: 9,
									},
									{
										name: '10am',
										displayName: '10am',
										value: 10,
									},
									{
										name: '11am',
										displayName: '11am',
										value: 11,
									},
									{
										name: 'Noon',
										displayName: 'Noon',
										value: 12,
									},
									{
										name: '1pm',
										displayName: '1pm',
										value: 13,
									},
									{
										name: '2pm',
										displayName: '2pm',
										value: 14,
									},
									{
										name: '3pm',
										displayName: '3pm',
										value: 15,
									},
									{
										name: '4pm',
										displayName: '4pm',
										value: 16,
									},
									{
										name: '5pm',
										displayName: '5pm',
										value: 17,
									},
									{
										name: '6pm',
										displayName: '6pm',
										value: 18,
									},
									{
										name: '7pm',
										displayName: '7pm',
										value: 19,
									},
									{
										name: '8pm',
										displayName: '8pm',
										value: 20,
									},
									{
										name: '9pm',
										displayName: '9pm',
										value: 21,
									},
									{
										name: '10pm',
										displayName: '10pm',
										value: 22,
									},
									{
										name: '11pm',
										displayName: '11pm',
										value: 23,
									},
								],
								description: 'The hour of the day to trigger',
							},
							{
								name: 'triggerAtMinute',
								displayName: 'Trigger at Minute',
								type: 'number',
								typeOptions: {
									minValue: 0,
									maxValue: 59,
								},
								default: 0,
								description: 'The minute past the hour to trigger (0-59)',
							},
						],
					},
					{
						displayName: 'Cron Expression',
						name: 'cronExpression',
						type: 'string',
						default: '',
						values: [
							{
								name: 'value',
								displayName: 'Expression',
								type: 'string',
								default: '',
								description:
									'You can find help generating your cron expression <a href="https://crontab.guru/"></a>',
								hint: '[Second] [Minute] [Hour] [Day of Month] [Month] [Day of Week]',
							},
						],
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const rule = this.getNodeParameter('rule', []) as IDataObject;
		const timezone = this.getTimezone();
		const date = moment.tz(timezone).week();
		let cronJobs: CronJob[] = [];
		let intervalObj: NodeJS.Timeout;
		const executeTrigger = () => {
			// @ts-ignore
			if (!rule.weeks || (52 - date) % rule.weeks.value) {
				const resultData = {
					timestamp: moment.tz(timezone).toISOString(),
					'Readable date': moment.tz(timezone).format('MMMM Do YYYY, h:mm:ss a'),
					'Readable time': moment.tz(timezone).format('h:mm:ss a'),
					'Day of week': moment.tz(timezone).format('dddd'),
					Year: moment.tz(timezone).format('YYYY'),
					Month: moment.tz(timezone).format('MMMM'),
					'Day of month': moment.tz(timezone).format('DD'),
					Hour: moment.tz(timezone).format('HH'),
					Minute: moment.tz(timezone).format('mm'),
					Second: moment.tz(timezone).format('ss'),
					Timezone: moment.tz(timezone).format('z Z'),
				};
				this.emit([this.helpers.returnJsonArray([resultData])]);
			}
		};
		let intervalValue = 1000;
		if (rule.cronExpression) {
			const cronExpression = rule.cronExpression as IDataObject;
			const cronArray: string[] = [];
			cronArray.push(cronExpression.value as string);
			cronJobs = cronArray.map(
				(cronArray) => new CronJob(cronArray, executeTrigger, undefined, true, timezone),
			);
		}
		if (rule.seconds) {
			const seconds = rule.seconds as IDataObject;
			intervalValue *= seconds.value as number;
			intervalObj = setInterval(executeTrigger, intervalValue);
		}
		if (rule.minutes) {
			const minutes = rule.minutes as IDataObject;
			// @ts-ignore
			intervalValue *= (60 * minutes.value) as number;
			intervalObj = setInterval(executeTrigger, intervalValue);
		}

		if (rule.hours) {
			const expression: TriggerTime[] = [
				{
					mode: 'everyHour',
					// @ts-ignore
					hour: rule.hours.value,
					// @ts-ignore
					minute: rule.hours.triggerAtMinute,
				},
			];
			const cronTimes = (expression || []).map(toCronExpression);
			cronJobs = cronTimes.map(
				(crontime) => new CronJob(crontime, executeTrigger, undefined, true, timezone),
			);
		}

		if (rule.days) {
			const daysObject = rule.days as IDataObject;
			const day = daysObject.value?.toString() as string;
			const hour = daysObject.triggerAtHour?.toString() as string;
			const minute = daysObject.triggerAtMinute?.toString() as string;
			const cronTimes: ICronExpression = [minute, hour, `*/${day}`, '*', '*'];
			const cronExpression: string = cronTimes.join(' ');
			const cronJob = new CronJob(cronExpression, executeTrigger, undefined, true, timezone);
			cronJobs.push(cronJob);
		}

		if (rule.weeks) {
			const weeksObject = rule.weeks as IDataObject;

			const days = weeksObject.triggerAtDay as IDataObject[];
			const day = days.join(',') as string;
			const hour = weeksObject.triggerAtHour?.toString() as string;
			const minute = weeksObject.triggerAtMinute?.toString() as string;
			const cronTimes: ICronExpression = [minute, hour, '*', '*', day];
			const cronExpression: string = cronTimes.join(' ');
			const cronJob = new CronJob(cronExpression, executeTrigger, undefined, true, timezone);
			cronJobs.push(cronJob);
		}

		if (rule.months) {
			const monthsObejct = rule.months as IDataObject;
			const month = monthsObejct.value?.toString() as string;
			const day = monthsObejct.triggerAtDayOfMonth?.toString() as string;
			const hour = monthsObejct.triggerAtHour?.toString() as string;
			const minute = monthsObejct.triggerAtMinute?.toString() as string;
			const cronTimes: ICronExpression = [minute, hour, day, `*/${month}`, '*'];
			const cronExpression: string = cronTimes.join(' ');
			const cronJob = new CronJob(cronExpression, executeTrigger, undefined, true, timezone);
			cronJobs.push(cronJob);
		}

		async function closeFunction() {
			for (const cronJob of cronJobs) {
				cronJob.stop();
			}
			clearInterval(intervalObj);
		}

		async function manualTriggerFunction() {
			executeTrigger();
		}

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
}
