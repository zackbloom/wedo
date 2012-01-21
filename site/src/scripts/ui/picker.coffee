class Picker
  constructor: (@$elem, @opts={}) ->
    @opts.colors ?= ['red', 'gray', 'blue']

    @opts.default_color ?= @opts.colors[0]
    
    @value ?= @opts.value ? @opts.default_color

    @$elem.addClass 'picker'
    do @update

    @$elem.click (e) =>
      do e.preventDefault

      do @cycle

  cycle: ->
    current_i = @opts.colors.indexOf @value
    next_i = (current_i + 1) % @opts.colors.length

    @value = @opts.colors[next_i]

    do @update

  update: ->
    for color in @opts.colors
      @$elem.removeClass color

    @$elem.addClass @value

    @$elem.attr('value', @value)

    @$elem.trigger 'pickerUpdate', [@value]

$.fn.picker = (opts={}) ->
  this.data('picker', new Picker(this, opts))
