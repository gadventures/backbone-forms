// Setup a DOM for jquery to use
document = require('jsdom').jsdom();
window = document.defaultView;
window.jQuery = jQuery = window.$ = $ = require('jquery');
// Mock localStorage for bows logging.
window.localStorage = {};

var Backbone = require('backbone'),
    assert = require('assert'),
    Form = require('../forms').Form,
    fields = require('../fields'),
    fixtures = require('./fixtures'),
    mockSchema = fixtures.mockSchema,
    mockDateField = fixtures.mockDateField,
    mockField = fixtures.mockField;

Backbone.$ = $;

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
            '<input type="text" id="bar" name="bar">\n\n');
    });

    it("should initialize with schema", function() {
        var form = new Form({
            schema: mockSchema
        });
        assert.ok(form);
    });
});


describe("clean spec", function() {

    it("should clean fields", function() {
        var form = new Form({
            schema: mockSchema
        });

        form.render();
        form.$("#first_name").val("Foo");

        var data = form.cleaned();
        assert.equal(data.first_name, "Foo");
    });

    it("should clean on hooked field", function() {
        var myForm = Form.extend({
            clean_first_name: function(data) {
                // Reverse the string
                var val = data.first_name;
                return val.split("").reverse().join("");
            }
        });

        var form = new myForm({
            schema: mockSchema
        });

        form.render();
        form.$("#first_name").val("Foo");

        var data = form.cleaned();
        assert.equal(data.first_name, "ooF");
    });
});


describe("date field spec", function() {
    var dateField;

    beforeEach(function() {
        dateField = new fields.DateField({
            field: mockDateField
        });
        dateField.date = {
            day: null,
            year: null,
            month: null
        };
    });

    afterEach(function() {
        dateField = null;
    });

    it("should initialize", function() {
        assert.ok(dateField);
        assert.deepEqual(dateField.date, {
            day: null,
            year: null,
            month: null
        });
    });

    it("should render", function() {
        dateField.render();
        assert.ok(dateField);
    });

    it("should updateLocalDate correctly", function() {
        dateField.updateLocalDate("day", "2");
        assert.equal(dateField.date.day, "2");
    });

    it("should set model field when all fields valid", function() {
        var MockModel = Backbone.Model.extend({});
        var model = new MockModel();

        dateField.bindings(model);

        dateField.updateLocalDate("day", "22");
        assert.equal(model.get("issue_date"), null);

        dateField.updateLocalDate("month", "02");
        dateField.updateLocalDate("year", "2000");

        assert.equal(model.get("issue_date"), "2000-02-22");
    });

    it("should not set local date if model has null or undefined values", function() {
        var MockModel = Backbone.Model.extend({});
        var model = new MockModel();

        dateField.setLocalDate(model);
        assert.deepEqual(dateField.date, {
            day: null,
            year: null,
            month: null
        });

    });

    it("should set local date only when model has valid values", function() {
        var MockModel = Backbone.Model.extend({});
        var model = new MockModel({
            issue_date: "1999-01-30"
        });

        dateField.setLocalDate(model);
        assert.deepEqual(dateField.date, {
            day: "30",
            month: "01",
            year: "1999"
        });
    });
});
