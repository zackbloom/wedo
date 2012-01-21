window.$V ?= {}

$ ->
  $V.AppView = Backbone.View.extend
    el: $ '#app'

    initialize: ->
      @lists = {}

      $D.entries.bind 'add', this.addOne, this
      $D.entries.bind 'reset', this.addAll, this

      do $D.entries.fetch

    addAll: ->
      $D.entries.each this.addOne, false

    addOne: (entry, refresh=true) ->
      $list_el = $('[user-id=' + entry.attributes.user_id + '] ul')

      view = new $V.Entry
        model: entry

      $list_el.append view.render().el

      if refresh
        $list_el.trigger 'refreshList'

  window.App = new $V.AppView
