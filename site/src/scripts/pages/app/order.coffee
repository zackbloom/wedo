$ ->
  $(".list.big ul").isotope
    itemSelector: 'li'
    layoutMode: 'straightDown'
    resizesContainer: false

    sortBy: 'alpha'
    getSortData:
      alpha: ($elem) ->
        $elem.text().toLowerCase()
