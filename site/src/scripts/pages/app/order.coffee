$ ->
  $(".list.big ul").isotope
    itemSelector: 'li'
    layoutMode: 'straightDown'

    sortBy: 'alpha'
    getSortData:
      alpha: ($elem) ->
        console.log $elem.text()
        $elem.text()
