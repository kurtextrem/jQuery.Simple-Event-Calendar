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
		this.events = {}

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
		_count: -1,
		onShowEvent: function () {}
	}

	Simplecalendar.prototype.addListener = function () {
		this.$calendar.on('click', 'tr > td', this.displayEvent.bind(this))

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
	}

	Simplecalendar.prototype.render = function () {
		this.setMonth()

		if (!this.issetDayNames())
			this.setDayNames()

		if (!this.issetDays()) {
			this.setDays()
			this.setEvents()
			this.setCurrentDay()
		}

		this.displayEvent()
	}

	Simplecalendar.prototype.setMonth = function () {
		this.$month.text(this.getMonthName(this.month) + ' ' + this.year)
		this.$month.attr({
			'data-month': this.month,
			'data-year': this.year
		})
	}

	Simplecalendar.prototype.setDayNames = function () {
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

	Simplecalendar.prototype.setDays = function () {
		var length = getMonthLength(this.month, this.year),
		html = '',
		tr = ['', '', '', '', '']

		for (var i = 1; i <= length; i++) {
			if (i < 8) {
				tr[0] += '<td data-month="' + this.month + '" data-day="' + i + '" data-year="' + this.year + '">' + i + '</td>'
			} else if (i < 15) {
				tr[1] += '<td data-month="' + this.month + '" data-day="' + i + '" data-year="' + this.year + '">' + i + '</td>'
			} else if (i < 22) {
				tr[2] += '<td data-month="' + this.month + '" data-day="' + i + '" data-year="' + this.year + '">' + i + '</td>'
			} else if (i < 29) {
				tr[3] += '<td data-month="' + this.month + '" data-day="' + i + '" data-year="' + this.year + '">' + i + '</td>'
			} else if (i < 32) {
				tr[4] += '<td data-month="' + this.month + '" data-day="' + i + '" data-year="' + this.year + '">' + i + '</td>'
			}
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
		this.$elem.find('.day-event').each(function (i, event) {
			this.addEvent(event.dataset.day, event.dataset.month, event.dataset.year, event.dataset.eventClass || '')
		}.bind(this))
	}

	Simplecalendar.prototype.addEvent = function (day, month, year, eventClass) {
		var s = year + '-' + month
		if (!this.events[s])
			this.events[s] = []

		this.events[s].push({
			eventClass: eventClass,
			day: day
		})
	}

	Simplecalendar.prototype.removeEvent = function (day, month, year) {

	}

	Simplecalendar.prototype.setEvents = function () {
		var events = this.events[this.year + '-' + this.month] || []
		for (var i = 0; i < events.length; i++) {
			this.$calendar.find('td[data-month="' + this.month + '"][data-day="' + events[i].day + '"][data-year="' + this.year + '"]').addClass('event ' + events[i].eventClass)
		}
	}

	Simplecalendar.prototype.displayEvent = function (e) {
		var month = this.month,
			day = this.today

		this.$calendar.find('.active').removeClass('active')
		if (e) {
			month = e.currentTarget.dataset.month,
			day = e.currentTarget.dataset.day
			e.currentTarget.classList.add('active')
		}

		$('.day-event.in', this.$elem).slideUp('fast')

		$('.day-event[data-month="' + month + '"][data-day="' + day + '"][data-year="' + this.year + '"]', this.$elem).slideDown('fast').addClass('in')

		this.options.onShowEvent()
	}

	Simplecalendar.prototype.setCurrentDay = function (month, year) {
		this.$calendar.find('td[data-month="' + _month + '"][data-day="' + this.today + '"][data-year="' + _year + '"]').addClass('current-day')
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

		$('.close').click(function (e) {
			$(e.currentTarget).parent().slideUp('fast')
		})

		$('.print-btn').click(function () {
			window.print()
		})

		return this
	}

	$.fn.simplecalendar = Plugin
	$.fn.simplecalendar.Constructor = Simplecalendar
}(window, jQuery);
