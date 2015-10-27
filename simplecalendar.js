!function (window, $) {
	'use strict'

	var _date = new Date(),
		_month = _date.getMonth() + 1,
		_year = _date.getFullYear() // for copying purposes

	function Simplecalendar(element, options) {
		this.options = options

		this.$elem = $(element)
		this.$month = this.$elem.find('.month')
		this.$calendar = this.$elem.find('.event-calendar')
		this.$days = this.$elem.find('.event-days > tr')
		this.$selected = []
		this.$events = $(this.options.events)
		this.events = {}
		if (this.options.selectRange) {
			this.$all = $(this.options.otherInstances).find('.event-calendar')
		} else {
			this.$all = this.$calendar
		}

		this.today = _date.getDate()
		this.month = _month + options._count
		this.year = _year
		if (this.month === 13) {
			this.month = 1
			this.year = _year + 1
		}

		this.parseEvents()
		this.render(this.month, this.year)
		this.addListener()
	}

	Simplecalendar.VERSION = '0.1'

	Simplecalendar.DEFAULT = {
		days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'],
		months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		events: '.events',
		otherInstances: '.simplecalendar',

		selectRange: true,

		_count: -1,

		onShowEvent: function () {}
	}

	Simplecalendar.prototype.addListener = function () {
		this.$calendar.on('click', 'tr > td', this.dayClick.bind(this))

		$('.btn-next', this.$elem).click(function (e) {
			if (this.month === 12) {
				++this.year
				this.month = 0
			}

			++this.month
			this.render()
		}.bind(this))

		$('.btn-prev', this.$elem).click(function (e) {
			if (this.month === 1) {
				--this.year
				this.month = 12
			}

			--this.month
			this.render()
		}.bind(this))

		if (this.options.selectRange) {
			this.$all.on('click', 'tr > td', function (e) {
				this.markRange(e.currentTarget)
			}.bind(this))
			this.$all.on('mouseover', 'tr > td', this.rangeHover.bind(this))
		}
	}

	Simplecalendar.prototype.render = function () {
		this.renderMonth()

		if (!this.issetDayNames())
			this.renderDayNames()

		if (!this.issetDays()) {
			this.renderDays()
			this.renderEvents()
			this.renderCurrentDay()
		}

		this.displayEvent(this.$calendar.find('td[data-month="' + this.month + '"][data-day="' + this.today + '"][data-year="' + this.year + '"]').data('events'))
	}

	Simplecalendar.prototype.renderMonth = function () {
		this.$month.text(this.getMonthName(this.month) + ' ' + this.year)
		this.$month.attr({
			'data-month': this.month,
			'data-year': this.year
		})
	}

	Simplecalendar.prototype.renderDayNames = function () {
		var firstDay = getFirstDayOfMonth(this.month, this.year),
		html = ''

		// create new copy to prevent modification, cut out and add them in the true order
		var _days = this.options.days.slice(0),
		days = _days.splice(firstDay)

		days = days.concat(_days)
		for (var i = 0; i < days.length; i++) {
			html += '<td data-month="' + this.month + '" data-year="' + this.year + '">' + days[i] + '</td>'
		}

		this.$days.append(html)
	}

	Simplecalendar.prototype.issetDayNames = function () {
		this.$days.find('td').addClass('hidden')

		var $elems = this.$days.find('td[data-month="' + this.month + '"][data-year="' + this.year + '"]')
		if ($elems.length > 0)
			return $elems.removeClass('hidden')

		return false
	}

	Simplecalendar.prototype.renderDays = function () {
		var length = getMonthLength(this.month, this.year),
		html = '',
		tr = ['', '', '', '', ''],
		toAdd = 0

		for (var i = 1; i <= length; i++) {
			// if (i < 8)
			if (i < 15) {
				toAdd = 1
			} else if (i < 22) {
				toAdd = 2
			} else if (i < 29) {
				toAdd = 3
			} else if (i < 32) {
				toAdd = 4
			}
			tr[toAdd] += '<td data-month="' + this.month + '" data-day="' + i + '" data-year="' + this.year + '"><div>' + i + '</div></td>'
		}

		for (var i = 0; i < tr.length; i++) {
			html += '<tr class="' + (i + 1) + '" data-month="' + this.month + '" data-year="' + this.year + '">' + tr[i] + '</tr>'
		}

		this.$calendar.append(html)
	}

	Simplecalendar.prototype.issetDays = function () {
		this.$calendar.find('tr').addClass('hidden')

		var $elems = this.$calendar.find('tr[data-month="' + this.month + '"][data-year="' + this.year + '"]')
		if ($elems.length > 0)
			return $elems.removeClass('hidden')

		return false
	}

	Simplecalendar.prototype.parseEvents = function () {
		this.$events.find('.day-event').each(function (i, event) {
			var range = moment.range(new Date(+event.dataset.from), new Date(+event.dataset.to))
			range.by('day', function (moment) {
				this.addEvent(moment, event.dataset)
			}.bind(this))
		}.bind(this))
	}

	Simplecalendar.prototype.addEvent = function (moment, dataset) {
		var s = moment.year() + '-' + (moment.month() + 1),
		day = moment.date()
		if (!this.events[s])
			this.events[s] = {}

		if (!this.events[s][day])
			this.events[s][day] = {}

		this.events[s][day][dataset.eventid] = {
			from: '0:00',
			to: '23:59',
			eventClass: dataset.eventClass || '',
			eventid: dataset.eventid
		}
	}

	Simplecalendar.prototype.removeEvent = function (day, month, year, key) {
		// todo: add key support
		this.events[year + '-' + month][day] = undefined // faster than delete
	}

	Simplecalendar.prototype.renderEvents = function () {
		var events = this.events[this.year + '-' + this.month] || {}
		Object.keys(events).map(function (_day) {
			var day = events[_day],
			$day = this.$calendar.find('td[data-month="' + this.month + '"][data-day="' + _day + '"][data-year="' + this.year + '"]').addClass('event taken'),
			html = ''

			var spans = Object.keys(day)
			spans.map(function (key) {
				html += '<span class="event-bullet ' + day[key].eventClass + '" title="' + day[key].from + ' - ' + day[key].to + '"></span>'
			})
			$day.attr('data-events', spans.join(',')).append(html)
		}.bind(this))
	}

	Simplecalendar.prototype.dayClick = function (e) {
		this.$selected = this.$all.find('.selected')

		if (this.$selected.is(e.currentTarget)) { // toggle
			e.currentTarget.classList.remove('active')
			e.currentTarget.classList.remove('selected')
			return
		}

		if (this.$selected.length > 1) {
			this.$selected.removeClass('selected')
			this.$all.find('.active').removeClass('active')
		}

		e.currentTarget.classList.add('active') // hover
		e.currentTarget.classList.add('selected')

		this.displayEvent(e.currentTarget.dataset.events)
	}

	Simplecalendar.prototype.displayEvent = function (id) {
		if (!id) return
		id = id.split(',')

		this.$events.find('.in').slideUp('fast').removeClass('in')

		for (var i = 0; i < id.length; i++) {
			this.$events.find('.day-event[data-eventid="' + id[i] + '"]').slideDown('fast').addClass('in')
		}

		this.options.onShowEvent(id)
	}

	Simplecalendar.prototype.renderCurrentDay = function (month, year) {
		this.$calendar.find('td[data-month="' + _month + '"][data-day="' + this.today + '"][data-year="' + _year + '"]').addClass('current-day')
	}

	Simplecalendar.prototype.markRange = function (to, from) {
		// select all days in between and give class
		if (this.$selected.length === 0) return // css hover does our job
		if (!to || this.$selected.length === 2)
			to = this.$selected[1]
		to = to.dataset
		from = this.$selected[0].dataset

		var range = moment.range(new Date(from.year, from.month, from.day), new Date(to.year, to.month, to.day))
		range.by('day', function (moment) {
			this.$all.find('td[data-month="' + moment.month() + '"][data-day="' + moment.date() + '"]').addClass('active')
		}.bind(this))
	}

	Simplecalendar.prototype.rangeHover = function (e) {
		this.$selected = this.$all.find('.selected')
		if (this.$selected.length === 2) return // don't mark if theres a range

		this.$all.find('.active').removeClass('active')

		this.markRange(e.currentTarget)
	}

	Simplecalendar.prototype.getMonthName = function (month) {
		return this.options.months[month - 1]
	}

	function getFirstDayOfMonth(month, year) {
		return new Date(year, month - 1, 1).getDay()
	}

	function getMonthLength(month, year) {
		return new Date(year, month - 1, 0).getDate()
	}

	var triggered = false
	function Plugin(options) {
		options = $.extend({}, Simplecalendar.DEFAULT, options)
		this.each(function () {
			++options._count
			new Simplecalendar(this, options)
		})

		this.on('click', '.btn-prev, .btn-next', function (e) {
			if (!triggered) {
				triggered = true
				$('.' + e.currentTarget.classList[0]).each(function (i, item) {
					if (item !== e.currentTarget)
						this.click()
				})
				return
			}
			triggered = false
		}.bind(this))

		$('.close', this).click(function (e) {
			$(e.currentTarget).parent().slideUp('fast')
		})

		return this
	}

	$.fn.simplecalendar = Plugin
	$.fn.simplecalendar.Constructor = Simplecalendar
}(window, jQuery);
