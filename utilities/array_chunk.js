// https://github.com/jashkenas/underscore/pull/587
_.mixin({
    chunk : function (array, unit) {
        if (!_.isArray(array)) return array;
        unit = Math.abs(unit);
        var results = [],
        length = Math.ceil(array.length / unit);

        for (var i = 0; i < length; i++) {
            results.push(array.slice( i * unit, (i + 1) * unit));
        }
        return results;
    }
});
