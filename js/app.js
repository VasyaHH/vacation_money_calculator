const App = {
	data() {
		// добавить период отпуска
		return {
			vacation_start: '',
			vacation_length: '',
			employmentDate: '',
			calcPeriod: {
				start: '',
				end: '',
			},
			recentVacationsPeriods: [],
			vacationProlongationPeriods: [],
			sickPeriods: [],
			leaveOfAbsencePeriods: [],
			workerSum: '',
			date_format: 'DD.MM.YYYY',
			holidays: [
				'01.01.2000', // НГ
				'02.01.2000', // НГ
				'03.01.2000', // НГ
				'04.01.2000', // НГ
				'05.01.2000', // НГ
				'06.01.2000', // НГ
				'07.01.2000', // Рождество
				'08.01.2000', // НГ
				'23.02.2000', // 23 февраля
				'08.03.2000', // 8 марта
				'01.05.2000', // Праздник Весны и Труда
				'09.05.2000', // День победы
				'12.06.2000', // День России
				'04.11.2000', // День народного единства
			],
			types: {
				vacation: 'vacation',
				vacation_prolongation: 'vacation_prolongation',
				sick: 'sick',
				leave_of_absence: 'leave_of_absence',

			}
		}
	},
	methods: {
		clearAllExclusions() {
			this.vacationProlongationPeriods = [];
			this.recentVacationsPeriods = [];
			this.sickPeriods = [];
			this.leaveOfAbsencePeriods = [];
			this.workerSum = '';
		},
		workerSumChangedHandler(e) {
			this.workerSum = e.target.value.replace(/[\s]/, '');
		},
		splitPeriodsByMonth(periods) {
			let result = [];
			periods.forEach(period => {
				result.push(...this.splitPeriodByMonth(period))
			})
			return result;
		},
		hasProlongationStartOnDate(prolongationStartDate) {
			return this.vacationProlongationPeriods.some(period => {
				return period.start === prolongationStartDate && this.isValidDate(prolongationStartDate);
			});
		},
		addVacationPeriod() {
			this.recentVacationsPeriods.push({ start: '', end: '', type: this.types.vacation });
			this.$nextTick(() => {
				this.$refs.recentVacationInput[this.recentVacationsPeriods.length - 1].focus();
			})
		},
		addSickPeriod() {
			this.sickPeriods.push({ start: '', end: '', type: this.types.sick })
			this.$nextTick(() => {
				this.$refs.sickPeriodInput[this.sickPeriods.length - 1].focus();
			})
		},
		addLeaveOfAbsencePeriod() {
			this.leaveOfAbsencePeriods.push({ start: '', end: '', type: this.types.leave_of_absence })
			this.$nextTick(() => {
				this.$refs.leaveOfAbsenceInput[this.leaveOfAbsencePeriods.length - 1].focus();
			})
		},
		addVacationProlongationPeriod() {
			this.vacationProlongationPeriods.push({ start: '', end: '', type: this.types.vacation_prolongation });
			this.$nextTick(() => {
				this.$refs.vacationProlongationInput[this.vacationProlongationPeriods.length - 1].focus();
			})
		},
		isHoliday(date) {
			let monthDay = this.dateCreate(date).format('MMDD');
			return this.holidays.some(holidayDate => this.dateCreate(holidayDate).format('MMDD') === monthDay);
		},
		getHolidaysCount(periodStart, periodEnd) {
			let startDate = this.dateCreate(periodStart).format('MMDD');
			let endDate = this.dateCreate(periodEnd).format('MMDD');
			let periodHolidays = this.holidays.filter(date => {
				let currentDate = this.dateCreate(date).format('MMDD');
				return (currentDate >= startDate && currentDate <= endDate);
			})
			return periodHolidays.length;
		},
		datePlaceholderSelectPart(e) {
			if (e.target.selectionStart !== e.target.selectionEnd) {
				e.preventDefault();
				return;
			}
			const selectionRanges = [[0, 2], [3, 5], [6, 10]];
			const selectedRange =_.find(selectionRanges.reverse(), ([start]) => start <= e.target.selectionStart)
			e.target.selectionStart = selectedRange[0];
			e.target.selectionEnd = selectedRange[1];
		},
		datePlaceholderArrowKeysHandler(e) {
			return;
			if (e.code === 'ArrowLeft') {
				e.target.selectionStart = _.max([e.target.selectionStart - 2, 0]);
				e.target.selectionEnd = e.target.selectionStart;
				this.datePlaceholderSelectPart(e);
			} else if (e.code === 'ArrowRight') {
				e.target.selectionStart = _.min([e.target.selectionStart + 3, 10]);
				e.target.selectionEnd = e.target.selectionStart;
				this.datePlaceholderSelectPart(e);
			} else if (e.code === 'ArrowUp') {
				e.preventDefault()
				return false;
			} else if (e.code === 'ArrowDown') {
				e.preventDefault()
			}
		},
		datePlaceholderChangeHandler($event, type, idx, startOrEnd) {
			switch (type) {
				case this.types.vacation: {
					this.recentVacationsPeriods[idx][startOrEnd] = $event.target.value;
					break;
				}
				case this.types.sick: {
					this.sickPeriods[idx][startOrEnd] = $event.target.value;
					break;
				}
				case this.types.leave_of_absence: {
					this.leaveOfAbsencePeriods[idx][startOrEnd] = $event.target.value;
					break;
				}
				case this.types.vacation_prolongation: {
					this.vacationProlongationPeriods[idx][startOrEnd] = $event.target.value;
					break;
				}
				default:
					alert(`Неизвестный тип ${type}`);
			}
		},
		isValidDate(date) {
			return dayjs(date, this.date_format, true).isValid()
		},
		daysBetweenDatesInclusive(start, end) {
			if (!start || !end) {
				return 0;
			}
			if (typeof start === 'string') {
				start = this.dateCreate(start);
			}
			if (typeof end === 'string') {
				end = this.dateCreate(end);
			}
			if (end < start) {
				// alert('Дата начала не может быть больше конца');
				throw Error(`Дата начала не может быть больше конца ${start} -> ${end}`);
			}
			return end.diff(start, 'd') + 1;
		},
		dateCreate(str) {
			return dayjs(str, this.date_format, true);
		},
		calcWorkingDaysInPeriod({start}) {
			let startDate = this.dateCreate(start);
			let monthYear = startDate.format('MM.YYYY');
			let notWorkingDays = startDate.date() - 1 + (this.notWorkingDaysCount[monthYear] ?? 0);
			let workingDays = 29.3 - notWorkingDays * 29.3 / startDate.daysInMonth();
			return _.max([_.round(workingDays, 2), 0]);
		},
		isFullMonth(period) {
			let dateStart = this.dateCreate(period.start);
			if (dateStart.format('MM.DD.YYYY') !== dateStart.startOf('month').format('MM.DD.YYYY')) {
				return false;
			}
			let monthYear = dateStart.format('MM.YYYY');
			return (this.notWorkingDaysCount[monthYear] ?? 0) === 0;
		},
		calcPeriodCalculation() {
			if (
				!/\d+/.test(this.vacation_length)
				|| this.vacation_length <= 0
				|| !this.isValidDate(this.vacation_start)
			) {
				this.calcPeriod.start = '';
				this.calcPeriod.end = '';
				return;
			}
			let calcPeriodEnd = this.dateCreate(this.vacation_start).subtract(1, 'month').endOf('month');
			let calcPeriodStart = calcPeriodEnd.subtract(11, 'month').startOf('month');
			this.calcPeriod.end = calcPeriodEnd.format(this.date_format);
			this.calcPeriod.start = calcPeriodStart.format(this.date_format);
			if (this.isValidDate(this.employmentDate)) {
				let employmentDate = this.dateCreate(this.employmentDate);
				this.calcPeriod.start = _.max([calcPeriodStart, employmentDate]).format(this.date_format);
			}
		},
		hasIntersection(period1, period2) {
			return this.intersectDaysCount(period1, period2) > 0;
		},
		intersectDaysCount(period1, period2) {
			if (!this.isValidDate(period1.start) || !this.isValidDate(period1.end)
				|| !this.isValidDate(period2.start) || !this.isValidDate(period2.end)
			) {
				return 0;
			}
			let intersectionStartDate = _.max([this.dateCreate(period1.start), this.dateCreate(period2.start)]);
			let intersectionEndDate = _.min([this.dateCreate(period1.end), this.dateCreate(period2.end)]);
			let diff = intersectionEndDate.diff(intersectionStartDate, 'day') + 1;
			// 0 - значит пересечений нет,
			return _.max([diff, 0]);
		},
		hasSickOnPeriod(period) {
			return this.getSickForPeriod(period).length > 0;
		},
		getSickForPeriod(period) {
			const sickPeriods = [];
			this.sickPeriods.forEach(sickPeriod => {
				if (this.hasIntersection(sickPeriod, period)) {
					sickPeriods.push(sickPeriod);
				}
			});
			return sickPeriods;
		},
		enhancePeriods(periods) {
			let vacationsWithSick = periods.map(modifyPeriod => {
				if (!modifyPeriod.start || !modifyPeriod.end
					|| !this.isValidDate(modifyPeriod.start) || !this.isValidDate(modifyPeriod.end)) {
					return {
						...modifyPeriod,
						sickPeriods: [],
						length: 0,
						holidaysCount: 0,
					};
				}
				let vacationEnd = modifyPeriod.end;
				let vacationLength = this.daysBetweenDatesInclusive(modifyPeriod.start, vacationEnd);
				let sickPeriods = this.getSickForPeriod(modifyPeriod);
				let lastPeriodDates = [modifyPeriod.end];
				sickPeriods.forEach(sickPeriod => {
					vacationLength -= this.intersectDaysCount(sickPeriod, modifyPeriod);
					lastPeriodDates.push(sickPeriod.end);
				});
				// максимальная дата всех периодов
				let lastDate = _.max(lastPeriodDates.map(date => this.dateCreate(date)));
				// дата начала продления отпуска
				let prolongationStartDate = lastDate.add(1, 'day').format(this.date_format);
				// есть ли продление отпуска
				let hasProlongation = this.hasProlongationStartOnDate(prolongationStartDate);
				let holidaysCount = this.getHolidaysCount(modifyPeriod.start, vacationEnd);

				return {
					...modifyPeriod,
					sickPeriods,
					hasProlongation,
					end: vacationEnd,
					length: vacationLength - holidaysCount,
					holidaysCount,
				}

			});
			console.log({ vacationsWithSick })
			return vacationsWithSick;
		},
		splitPeriodByMonth(period) {
			const periodStart = this.dateCreate(period.start);
			const periodEnd = this.dateCreate(period.end);
			if (periodStart.month() === periodEnd.month()) {
				return [period];
			}
			return [
				{
					...period,
					end: periodStart.endOf('month').format(this.date_format),
					length: this.daysBetweenDatesInclusive(period.start, periodStart.endOf('month'))
				},
				{
					...period,
					start: periodEnd.startOf('month').format(this.date_format),
					length: this.daysBetweenDatesInclusive(periodEnd.startOf('month'), period.end)
				},
			];
		},
		runTests() {
			let restoreState = this.saveState();
			this.test1();
			this.test2();
			this.test3();
			this.test4();
			restoreState();
		},
		test1() {
			this.vacation_start = '05.03.2023';
			this.vacation_length = '14';
			this.employmentDate = '11.02.2020';
			this.calcPeriod.start = '01.02.2022';
			this.calcPeriod.end = '31.01.2023';
			this.recentVacationsPeriods = [
				{
					start: '21.01.2022',
					end: '03.02.2022'
				}
			];
			this.resultTable.forEach(row => {
				if (row.monthYear === '02.2022') {
					this.assertEqual('26.16', row.workDays, 'Test1 не пройден');
				}
			})
		},
		test2() {
			this.vacation_start = '15.03.2023';
			this.vacation_length = '14';
			this.employmentDate = '01.01.2020';
			this.calcPeriod.start = '01.02.2022';
			this.calcPeriod.end = '31.01.2023';
			this.recentVacationsPeriods = [
				{
					start: '18.04.2022',
					end: '29.04.2022'
				},
				{
					start: '18.07.2022',
					end: '24.07.2022'
				},
				{
					start: '29.08.2022',
					end: '16.09.2022'
				},
			];
			this.vacationProlongationPeriods = [
				{
					start: '17.09.2022',
					end: '26.09.2022'
				},
			];
			this.sickPeriods = [
				{
					start: '03.09.2022',
					end: '12.09.2022'
				},
				{
					start: '12.12.2022',
					end: '20.12.2022'
				},
				{
					start: '24.01.2023',
					end: '31.01.2023'
				},
			];
			this.resultTable.forEach(row => {
				if (row.monthYear === '09.2022') {
					this.assertEqual('3.91', row.workDays, 'Test2 не пройден');
				}
			})
		},
		test3() {
			this.assertEqual(true, this.isValidDate('01.01.2020'), '01.01.2020');
			this.assertEqual(false, this.isValidDate('2020-01-01'), '2020-01-01');
			this.assertEqual(false, this.isValidDate(null), null);
			this.assertEqual(false, this.isValidDate(''), '');
			this.assertEqual(false, this.isValidDate(false), false);
			this.assertEqual(false, this.isValidDate(0), 0);
			this.assertEqual(false, this.isValidDate(300), 300);
		},
		test4() {
			this.vacation_start = '19.03.2023';
			this.vacation_length = '14';
			this.employmentDate = '01.01.2022';
			this.calcPeriod.start = '01.03.2022';
			this.calcPeriod.end = '28.02.2023';
			this.recentVacationsPeriods = [
				{
					start: '20.03.2022',
					end: '02.04.2022'
				},
				{
					start: '24.08.2022',
					end: '06.09.2022'
				},
			];
			this.vacationProlongationPeriods = [
				{
					start: '30.09.2022',
					end: '06.10.2022'
				},
			];
			this.sickPeriods = [
				{
					start: '17.01.2022',
					end: '23.01.2022'
				},
				{
					start: '23.09.2022',
					end: '29.09.2022'
				},
				{
					start: '31.08.2022',
					end: '22.08.2022'
				},
				{
					start: '24.11.2022',
					end: '27.11.2022'
				},
				{
					start: '28.11.2022',
					end: '06.12.2022'
				},
				{
					start: '07.12.2022',
					end: '12.12.2022'
				},
			];
			this.enhancedVacations.forEach(period => {
				if (period.sickPeriods && period.hasProlongation) {
					alert(JSON.stringify({
						period,
						message: 'В тесте у всех больничных есть продление. Но программа считает иначе',
					}, null, 2));
				}
			});
		},
		assertEqual(expected, real, message) {
			if (expected === real) {
				return;
			}
			alert(JSON.stringify({
				expected,
				real,
				message,
			}, null, 2));
		},
		saveState() {
			const vacation_start = this.vacation_start;
			const vacation_length = this.vacation_length;
			const employmentDate = this.employmentDate;
			const recentVacationsPeriods = this.recentVacationsPeriods;
			const vacationProlongationPeriods = this.vacationProlongationPeriods;
			const sickPeriods = this.sickPeriods;
			const leaveOfAbsencePeriods = this.leaveOfAbsencePeriods;
			const calcPeriodStart = this.calcPeriod.start;
			const calcPeriodEnd = this.calcPeriod.end;
			return () => {
				this.vacation_start = vacation_start;
				this.vacation_length = vacation_length;
				this.employmentDate = employmentDate;
				this.recentVacationsPeriods = recentVacationsPeriods;
				this.vacationProlongationPeriods = vacationProlongationPeriods;
				this.sickPeriods = sickPeriods;
				this.leaveOfAbsencePeriods = leaveOfAbsencePeriods;
				this.calcPeriod.start = calcPeriodStart;
				this.calcPeriod.end = calcPeriodEnd;
			}
		}
	},
	mounted: function () {
		// this.vacation_start = '05.03.2023';
		// this.vacation_length = 14;
		// this.workerSum = 1000000;
		// this.employmentDate = '11.02.2020';
		// this.recentVacationsPeriods = [
			// {
			// 	start: '21.01.2022',
			// 	end: '03.02.2022',
			// 	type: 'vacation',
			// },
			// {
			// 	start: '19.10.2022',
			// 	end: '01.11.2022',
			// 	type: 'vacation',
			// },
		// ];
		// this.sickPeriods = [
			// {
			// 	start: '27.10.2022',
			// 	end: '02.11.2022',
			// 	type: 'sick',
			// },
		// ];
		// this.vacationProlongationPeriods = [
			// {
			// 	start: '03.11.2022',
			// 	end: '09.11.2022',
			// 	type: 'vacation_prolongation',
			// },
		// ];
		// this.leaveOfAbsencePeriods = [
		// 	{
		// 		start: '02.04.2022',
		// 		end: '06.04.2022',
		// 		type: 'leave_of_absence',
		// 	},
		// ];
		// this.calcPeriod.start = '01.02.2022';
		// this.calcPeriod.end = '31.01.2023';
		this.runTests();
	},
	watch: {
		vacation_start() {
			this.calcPeriodCalculation();
		},
		vacation_length() {
			this.calcPeriodCalculation();
		},
		employmentDate() {
			this.calcPeriodCalculation();
		},
	},
	computed: {
		errors() {
			const errors = [
				...this.intersectionErrors,
			];
			if (!this.isValidDate(this.employmentDate)) {
				errors.push('Не заполнена дата приема');
			}
			if (this.vacation_length && !/\d+/.test(this.vacation_length)) {
				errors.push('Продолжительность отпуска указана неверно');
			}
			return errors;
		},
		enhancedVacations() {
			return this.enhancePeriods(this.recentVacationsPeriods);
		},
		enhancedProlongations() {
			return this.enhancePeriods(this.vacationProlongationPeriods);
		},
		excludedPeriodsDayjs() {
			return [];
			return this.excludedPeriodsWithIndex.map(period => ({
				...period,
				start: period.start ? this.dateCreate(period.start) : null,
				end: period.end ? this.dateCreate(period.end) : null,
			}));
		},
		excludedPeriodsErrors() {
			return this.excludedPeriodsDayjs.map(({start, end}) => {
				let errors = [];
				if (start && !start.isValid()) {
					errors.push('Неправильная дата начала периода');
					return errors;
				}
				if (end && !end.isValid()) {
					errors.push('Неправильная дата окончания периода');
					return errors;
				}
				if (end && start && end.diff(start, 'd') < 0) {
					errors.push('Начало периода больше, чем его окончание');
				}
				if (start && start < this.dateCreate(this.calcPeriod.start)) {
					errors.push('Начало периода выходит за левую границу расчетного периода');
				}
				if (end && end < this.dateCreate(this.calcPeriod.start)) {
					errors.push('Начало периода выходит за правую границу расчетного периода');
				}
				return errors;
			})
		},
		calcPeriodErrors() {
			let { start, end } = this.calcPeriod
			let errors = [];
			let startDate = this.dateCreate(start);
			if (start && !startDate.isValid()) {
				errors.push('Неправильна дата начала периода');
			}
			let endDate = this.dateCreate(end);
			if (end && !endDate.isValid()) {
				errors.push('Неправильна дата окончания периода');
			}
			let calculatedPeriodEnd = startDate.add(1, 'year').subtract(1, 'day');
			if (endDate > calculatedPeriodEnd) {
				errors.push('Период не может быть больше года');
			}
			if (endDate > this.dateCreate(this.vacation_start)) {
				errors.push('Расчетный период не может пересекаться с отпуском');
			}
			return errors;
		},
		vacationEnd() {
			if (!this.vacation_length) {
				return '';
			}
			if (!this.isValidDate(this.vacation_start)) {
				return '';
			}
			let endDate = this.dateCreate(this.vacation_start).add(this.vacation_length - 1, 'day');//.format(this.date_format);
			let holidaysCount = this.getHolidaysCount(
				this.dateCreate(this.vacation_start).format(this.date_format),
				endDate.format(this.date_format)
			);
			if (holidaysCount) {
				endDate = endDate.add(holidaysCount, 'day');
			}
			while (this.isHoliday(endDate.format(this.date_format))) {
				endDate = endDate.add(1, 'day');
			}
			return endDate.format(this.date_format);
		},

		vacationPeriodsWithSickIndexes() {
			return this.excludedPeriodsWithStopVacationAfterSick
				.filter(({ isVacationWithSick }) => isVacationWithSick)
				.map(({originIndex}) => originIndex);
		},
		intersectionErrors() {
			const periods = [
				this.enhancedProlongations,
				this.enhancedVacations,
				this.leaveOfAbsencePeriods,
			];
			const errors = [];
			for (let k = 0; k < periods.length; k++) {
				for (let n = k + 1; n < periods.length; n++) {
					Object.values(periods[k]).forEach(p1 => {
						Object.values(periods[n]).forEach(p2 => {
							if (this.hasIntersection(p1, p2)) {
								let message = `Периоды не должны пересекаться. 
								Период1: ${p1.start}-${p1.end}. Период2: ${p2.start}-${p2.end}.
								k=${k}, n=${n}`;
								errors.push(message);
							}
						});
					});
				}
			}
			return errors;
		},
		splitByMonthPeriods() {
			let result = [];
			const allPeriods = [
				this.enhancedProlongations,
				this.enhancedVacations,
				this.sickPeriods,
				this.leaveOfAbsencePeriods,
			];
			allPeriods.forEach(periods => {
				Object.values(periods).forEach(period => {
					result.push(...this.splitPeriodByMonth(period));
				});
			});
			return result;
		},
		splittedSickPeriods() {
			return this.splitPeriodsByMonth(this.sickPeriods);
		},
		notWorkingDates() {
			let notWorkingDates = {};
			this.splitByMonthPeriods.forEach(period => {
				let { start, end } = period;
				let startDate = _.max([this.dateCreate(start), this.dateCreate(this.calcPeriod.start)]);
				let endDate = _.min([this.dateCreate(end), this.dateCreate(this.calcPeriod.end)]);
				let monthYear = this.dateCreate(start).format('MM.YYYY');
				notWorkingDates[monthYear] = notWorkingDates[monthYear] ?? {};
				while (startDate <= endDate) {
					notWorkingDates[monthYear][startDate.format(this.date_format)] = 1;
					startDate = startDate.add(1, 'day');
				}
			});
			return notWorkingDates;
		},
		notWorkingDaysCount() {
			let result = {};
			Object.entries(this.notWorkingDates).forEach(([monthYear, dates]) => {
				result[monthYear] = Object.keys(dates).length;
			});
			return result;
		},
		resultMonths() {
			let startPeriodDate = this.dateCreate(this.calcPeriod.start);
			if (this.isValidDate(this.employmentDate)) {
				startPeriodDate = _.max([startPeriodDate, this.dateCreate(this.employmentDate)]);
			}
			let endPeriodDate = this.dateCreate(this.calcPeriod.end);
			let currentStartDate = startPeriodDate;
			let currentEndDate = startPeriodDate.endOf('month');
			let result = [];
			while (currentEndDate < endPeriodDate) {
				result.push({
					start: currentStartDate.format(this.date_format),
					end: currentEndDate.format(this.date_format),
				})
				currentStartDate = currentStartDate.add(1, 'month').startOf('month');
				currentEndDate = currentStartDate.endOf('month');
			}
			if (currentStartDate <= endPeriodDate) {
				result.push({
					start: currentStartDate.format(this.date_format),
					end: endPeriodDate.format(this.date_format),
				})
			}
			return result;
		},
		totalWorkingDays() {
			return _.sum(this.resultMonths.map(period => this.calcWorkingDaysInPeriod(period)));
		},
		avgSum() {
			if (this.totalWorkingDays === 0) {
				return 0;
			}
			return _.round((this.workerSum.toString().replace(',', '.')) / this.totalWorkingDays, 2);
		},
		resultTable() {
				return this.resultMonths.map(period => ({
					isFullMonth: this.isFullMonth(period),
					monthYear: this.dateCreate(period.start).format('MM.YYYY'),
					workDays: this.calcWorkingDaysInPeriod(period).toFixed(this.isFullMonth(period) ? 1 : 2),
				}));
		}
	}
}

const app = Vue.createApp(App);
app.config.globalProperties.dayjs = dayjs;
app.mount('#app')
