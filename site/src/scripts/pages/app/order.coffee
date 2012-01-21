$ ->
  $list = $(".list.big ul")
  $list.isotope
    itemSelector: 'li'
    layoutMode: 'straightDown'
    resizesContainer: false

    sortBy: 'start_time'
    getSortData:
      alpha: ($elem) ->
        $elem.text().toLowerCase()

      priority: ($elem) ->
        $elem.find('.picker').attr('value')

      add_time: ($elem) ->
        $elem.attr('start_time')

  $list.bind 'pickerUpdate', ->
    $list.isotope 'updateSortData', $list.data('isotope').$allAtoms
    $list.data('isotope')._sort()
    $list.isotope 'reLayout'

  $list.bind 'refreshList', ->
    $list.isotope 'reloadItems'
    $list.isotope 'reLayout', console.log

    # reLayout alone does not position the new item.
    $list.isotope
      layoutMode: 'straightDown'
