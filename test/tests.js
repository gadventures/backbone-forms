/*global window:true, describe, it, beforeEach, afterEach*/
var assert = require('assert'),
    $ = require('jquery'),
    Backbone = require('backbone'),
    Form = require('../forms'),
    fields = require('../fields');

// Setup a window for jquery to use.
window = require("jsdom").jsdom().createWindow();
$ = require('jquery/dist/jquery')(window);

Backbone.$ = $;


var mockField = {
    key: 'foo',
    label: 'Foo',
    errors: [],
    widget: {
        input_type: 'text',
        choices: []
    }
};

var mockDateField = {
    key: 'date',
    label: 'Date',
    errors: [],
    binding: 'issue_date',
    widget: {
        input_type: 'date',
        choices: [
            {
                title: 'day',
                data: [
                    { value: 1, key: 1},
                    { value: 2, key: 2}
                ]
            },
            {
                title: 'month',
                data: [
                    { value: "January", key: 1},
                    { value: "February", key: 2}
                ]
            },
            {
                title: 'year',
                data: [
                    { value: 1992, key: 1992 },
                    { value: 1993, key: 1993 }
                ]
            }
        ]
    }
};

describe("initialize form spec", function() {
    it("should fail without schema", function() {
        var schemalessForm = function() {
            return new Form();
        };
        assert.throws(schemalessForm);
    });

    it("should render a template", function() {
        var field = new fields.TextField({
            field: {
                required: false,
                key: 'foo',
                widget: {
                    title: 'bar',
                    input_type: 'text'
                }
            }
        });

        assert.equal(field.render().$el.html(),
            '<label for="foo"></label>\n' +
            '<input type="text" id="bar" name="bar" />\n\n\n');
    });

    it("should initialize with schema", function() {
        var form = new Form({
            schema: {
                title: "ProfileForm",
                fields: {
                    first_name: {
                        title: "first_name",
                        required: true,
                        label: "First Name",
                        error_messages: {
                            required: "This field is required",
                            invalid: "Enter a valid value."
                        },
                        min_length: null,
                        max_length: 50,
                        widget: {
                            title: "first_name",
                            input_type: "text"
                        }
                    }
                }
            }
        });
        assert.ok(form);
    });
});

describe("date field spec", function() {
    var dateField;

    beforeEach(function() {
        dateField = new fields.DateField({
            field: mockDateField
        });
    });

    afterEach(function() {
        dateField = null;
    });

    it("should initialize", function() {
        assert.ok(dateField);
    });

    it("should render", function() {
        dateField.render();
        assert.ok(dateField);
    });

    // What should we test from the Binding? Given the onGet function,
    // should test for various scenarios (e.g. if value is null, a single
    // item, etc.)
    it("should contain bindings", function() {
        var bindings = dateField.bindings();
        assert.ok(bindings['#date_day']);
        assert.equal(bindings['#date_day'].observe, 'issue_date');

        assert.ok(bindings['#date_month']);
        assert.equal(bindings['#date_month'].observe, 'issue_date');

        assert.ok(bindings['#date_year']);
        assert.equal(bindings['#date_year'].observe, 'issue_date');
    });

    it("should allow change on blank model attribute", function() {
        var MockModel = Backbone.Model.extend({});
        
        var model = new MockModel();
        var bindings = dateField.bindings(model);

        var binding = bindings['#date_day'];
        model.set({issue_date: binding.onSet('06', bindings)});
        assert.equal(model.get('issue_date'), '--06');

        binding = bindings['#date_year'];
        model.set({issue_date: binding.onSet(2002, bindings)});
        assert.equal(model.get('issue_date'), '2002--06');

        binding = bindings['#date_month'];
        model.set({issue_date: binding.onSet('05', bindings)});
        assert.equal(model.get('issue_date'), '2002-05-06');
    });

    it("should allow change on existing model attribute", function() {
        var MockModel = Backbone.Model.extend({
            defaults: {
                issue_date: "2002-05-06"
            }
        });

        var model = new MockModel();
        var bindings = dateField.bindings(model);

        var binding = bindings['#date_day'];
        model.set({issue_date: binding.onSet('22', bindings)});
        assert.equal(model.get('issue_date'), '2002-05-22');
    });
});
