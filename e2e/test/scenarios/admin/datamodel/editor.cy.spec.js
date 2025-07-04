const { H } = cy;
import {
  SAMPLE_DB_ID,
  SAMPLE_DB_SCHEMA_ID,
  USER_GROUPS,
} from "e2e/support/cypress_data";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";

const {
  ORDERS,
  ORDERS_ID,
  PRODUCTS_ID,
  REVIEWS,
  REVIEWS_ID,
  PEOPLE_ID,
  FEEDBACK,
  FEEDBACK_ID,
} = SAMPLE_DATABASE;
const { ALL_USERS_GROUP } = USER_GROUPS;
const MYSQL_DB_ID = SAMPLE_DB_ID + 1;
const MYSQL_DB_SCHEMA_ID = `${MYSQL_DB_ID}:PUBLIC`;

const ORDERS_DESCRIPTION =
  "Confirmed Sample Company orders for a product, from a user.";
const CUSTOM_MAPPING_ERROR =
  "You need unrestricted data access on this table to map custom display values.";

describe("scenarios > admin > datamodel > editor", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/database/*/schema/*").as("fetchTables");
    cy.intercept("GET", "/api/table/*/query_metadata*").as("fetchMetadata");
    cy.intercept("PUT", "/api/table").as("updateTables");
    cy.intercept("PUT", "/api/table/*").as("updateTable");
    cy.intercept("PUT", "/api/field/*").as("updateField");
    cy.intercept("PUT", "/api/table/*/fields/order").as("updateFieldOrder");
    cy.intercept("POST", "/api/field/*/dimension").as("updateFieldDimension");
  });

  describe("table settings", () => {
    beforeEach(() => {
      H.restore();
      cy.signInAsAdmin();
    });

    it("should allow changing the table name", () => {
      visitTableMetadata();
      setValueAndBlurInput("Orders", "New orders");
      cy.wait("@updateTable");
      H.undoToast().should("contain.text", "Updated Table display_name");
      cy.findByDisplayValue("New orders").should("be.visible");

      H.startNewQuestion();
      H.entityPickerModal().within(() => {
        H.entityPickerModalTab("Tables").click();
        cy.findByText("People").should("be.visible");
        cy.findByText("New orders").should("be.visible");
      });
    });

    it("should allow changing the table description", () => {
      visitTableMetadata();
      setValueAndBlurInput(ORDERS_DESCRIPTION, "New description");
      cy.wait("@updateTable");
      H.undoToast().should("contain.text", "Updated Table description");
      cy.findByDisplayValue("New description").should("be.visible");

      cy.visit(`/reference/databases/${SAMPLE_DB_ID}/tables/${ORDERS_ID}`);
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Orders").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("New description").should("be.visible");
    });

    it("should allow clearing the table description", () => {
      visitTableMetadata();
      clearAndBlurInput(ORDERS_DESCRIPTION);
      cy.wait("@updateTable");
      H.undoToast().should("contain.text", "Updated Table description");

      cy.visit(`/reference/databases/${SAMPLE_DB_ID}/tables/${ORDERS_ID}`);
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Orders").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("No description yet").should("be.visible");
    });

    it("should allow changing the table visibility", () => {
      visitTableMetadata();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Hidden").click();
      cy.wait("@updateTable");
      H.undoToast()
        .findByText("Updated Table visibility_type")
        .should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("5 Hidden Tables").should("be.visible");

      H.startNewQuestion();
      H.entityPickerModal().within(() => {
        H.entityPickerModalTab("Tables").click();
        cy.findByText("People").should("be.visible");
        cy.findByText("Orders").should("not.exist");
      });

      visitTableMetadata();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Queryable").click();
      cy.wait("@updateTable");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("4 Hidden Tables").should("be.visible");

      H.startNewQuestion();
      H.entityPickerModal().within(() => {
        H.entityPickerModalTab("Tables").click();
        cy.findByText("People").should("be.visible");
        cy.findByText("Orders").should("be.visible");
      });
    });

    it("should allow changing the field name", () => {
      visitTableMetadata();
      getFieldSection("TAX").within(() => {
        setValueAndBlurInput("Tax", "New tax");
      });
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Tax");
      getFieldSection("TAX").findByDisplayValue("New tax").should("be.visible");

      H.openOrdersTable();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("New tax").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Tax").should("not.exist");
    });

    it("should allow changing the field description", () => {
      visitTableMetadata();
      getFieldSection("TOTAL").within(() => {
        setValueAndBlurInput("The total billed amount.", "New description");
      });
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Total");
      getFieldSection("TOTAL")
        .findByDisplayValue("New description")
        .should("be.visible");

      cy.visit(
        `/reference/databases/${SAMPLE_DB_ID}/tables/${ORDERS_ID}/fields/${ORDERS.TOTAL}`,
      );
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Total").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("New description").should("be.visible");
    });

    it("should allow clearing the field description", () => {
      visitTableMetadata();
      getFieldSection("TOTAL").within(() => {
        clearAndBlurInput("The total billed amount.");
      });
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Total");

      cy.visit(
        `/reference/databases/${SAMPLE_DB_ID}/tables/${ORDERS_ID}/fields/${ORDERS.TOTAL}`,
      );
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Total").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("No description yet").should("be.visible");
    });

    it("should allow changing the field visibility", () => {
      visitTableMetadata();
      getFieldSection("TAX").findByDisplayValue("Everywhere").click();
      H.popover().findByText("Do not include").click();
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Tax");
      getFieldSection("TAX")
        .findByDisplayValue("Do not include")
        .should("be.visible");

      H.openOrdersTable();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Total").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Tax").should("not.exist");
    });

    it("should allow changing the field semantic type and currency", () => {
      visitTableMetadata();
      getFieldSection("TAX")
        .findByPlaceholderText("Select a semantic type")
        .should("have.value", "No semantic type")
        .click();
      searchAndSelectValue("Currency");
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Tax");
      getFieldSection("TAX")
        .findByPlaceholderText("Select a currency type")
        .should("be.visible");

      getFieldSection("TAX")
        .findByPlaceholderText("Select a currency type")
        .scrollIntoView()
        .should("have.value", "US Dollar")
        .click();
      searchAndSelectValue("Canadian Dollar");
      cy.wait("@updateField");

      H.openOrdersTable();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Tax (CA$)").should("be.visible");
    });

    it("should allow changing the field foreign key target", () => {
      visitTableMetadata();
      getFieldSection("USER_ID")
        .findByPlaceholderText("Select a target")
        .should("have.value", "People → ID")
        .click();
      H.popover().findByText("Products → ID").click();
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated User ID");
      getFieldSection("USER_ID")
        .findByPlaceholderText("Select a target")
        .should("have.value", "Products → ID")
        .and("be.visible");

      H.openTable({
        database: SAMPLE_DB_ID,
        table: ORDERS_ID,
        mode: "notebook",
      });
      cy.icon("join_left_outer").click();
      H.entityPickerModal().within(() => {
        H.entityPickerModalTab("Tables").click();
        cy.findByText("Products").click();
      });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("User ID").should("be.visible");
    });

    it("should allow sorting fields as in the database", () => {
      visitTableMetadata({ tableId: PRODUCTS_ID });
      verifyTableOrder("Database");
      H.openProductsTable();
      assertTableHeader([
        "ID",
        "Ean",
        "Title",
        "Category",
        "Vendor",
        "Price",
        "Rating",
        "Created At",
      ]);
    });

    it("should allow sorting fields alphabetically", () => {
      visitTableMetadata({ tableId: PRODUCTS_ID });
      cy.findByLabelText("Edit column order").click();
      setTableOrder("Alphabetical");
      H.openProductsTable();
      assertTableHeader([
        "Category",
        "Created At",
        "Ean",
        "ID",
        "Price",
        "Rating",
        "Title",
        "Vendor",
      ]);
    });

    it("should allow sorting fields smartly", () => {
      visitTableMetadata({ tableId: PRODUCTS_ID });
      cy.findByLabelText("Edit column order").click();
      setTableOrder("Smart");
      H.openProductsTable();
      assertTableHeader([
        "ID",
        "Created At",
        "Category",
        "Ean",
        "Price",
        "Rating",
        "Title",
        "Vendor",
      ]);
    });

    it("should allow sorting fields in the custom order", () => {
      visitTableMetadata({ tableId: PRODUCTS_ID });
      cy.findByLabelText("Edit column order").click();
      H.modal().findByLabelText("Sort").should("have.text", "Database");
      H.moveDnDKitElement(H.modal().findByLabelText("ID"), {
        vertical: 50,
      });
      cy.wait("@updateFieldOrder");

      cy.log("should not show loading state after an update (metabase#56482)");
      cy.findByTestId("loading-indicator", { timeout: 0 }).should("not.exist");

      H.modal().findByLabelText("Sort").should("have.text", "Custom");
      H.openProductsTable();
      assertTableHeader([
        "Ean",
        "ID",
        "Title",
        "Category",
        "Vendor",
        "Price",
        "Rating",
        "Created At",
      ]);
    });

    it("should allow switching to predefined order after drag & drop (metabase#56482)", () => {
      visitTableMetadata({ tableId: PRODUCTS_ID });
      cy.findByLabelText("Edit column order").click();
      H.modal().findByLabelText("Sort").should("have.text", "Database");
      H.moveDnDKitElement(H.modal().findByLabelText("ID"), {
        vertical: 50,
      });
      cy.wait("@updateFieldOrder");

      cy.log("should not show loading state after an update (metabase#56482)");
      cy.findByTestId("loading-indicator", { timeout: 0 }).should("not.exist");

      H.modal()
        .findAllByRole("listitem")
        .should(($items) => {
          expect($items[0].textContent).to.equal("Ean");
          expect($items[1].textContent).to.equal("ID");
        });

      H.modal().findByLabelText("Sort").should("have.text", "Custom");

      cy.log(
        "should allow switching to predefined order afterwards (metabase#56482)",
      );
      setTableOrder("Database");

      H.modal()
        .findAllByRole("listitem")
        .should(($items) => {
          expect($items[0].textContent).to.equal("ID");
          expect($items[1].textContent).to.equal("Ean");
        });

      cy.log("should allow drag & drop afterwards (metabase#56482)"); // extra sanity check
      H.moveDnDKitElement(H.modal().findByLabelText("ID"), {
        vertical: 50,
      });
      cy.wait("@updateFieldOrder");

      cy.log("should not show loading state after an update (metabase#56482)");
      cy.findByTestId("loading-indicator", { timeout: 0 }).should("not.exist");

      H.modal()
        .findAllByRole("listitem")
        .should(($items) => {
          expect($items[0].textContent).to.equal("Ean");
          expect($items[1].textContent).to.equal("ID");
        });
    });

    it("should allow hiding and restoring all tables in a schema", () => {
      visitTableMetadata();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("4 Queryable Tables").should("be.visible");
      cy.findByLabelText("Hide all").click();
      cy.wait("@updateTables");

      visitTableMetadata();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("8 Hidden Tables").should("be.visible");
      cy.findByLabelText("Unhide all").click();
      cy.wait("@updateTables");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("8 Queryable Tables").should("be.visible");
    });
  });

  describe("field settings", () => {
    beforeEach(() => {
      H.restore();
      cy.signInAsAdmin();
    });

    it("should allow changing the field name", () => {
      visitFieldMetadata({ fieldId: ORDERS.TAX });
      setValueAndBlurInput("Tax", "New tax");
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Tax");
      cy.findByDisplayValue("New tax").should("be.visible");

      H.openOrdersTable();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("New tax").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Tax").should("not.exist");
    });

    it("should allow changing the field description", () => {
      visitFieldMetadata({ fieldId: ORDERS.TOTAL });
      setValueAndBlurInput("The total billed amount.", "New description");
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Total");
      cy.findByDisplayValue("New description").should("be.visible");

      cy.visit(
        `/reference/databases/${SAMPLE_DB_ID}/tables/${ORDERS_ID}/fields/${ORDERS.TOTAL}`,
      );
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Total").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("New description").should("be.visible");
    });

    it("should allow changing the field visibility", () => {
      visitFieldMetadata({ fieldId: ORDERS.TAX });
      cy.findByDisplayValue("Everywhere").click();
      H.popover().findByText("Do not include").click();
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Tax");
      cy.findByDisplayValue("Do not include").should("be.visible");

      H.openOrdersTable();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Total").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Tax").should("not.exist");
    });

    it("should allow changing the field semantic type and currency", () => {
      visitFieldMetadata({ fieldId: ORDERS.TAX });
      cy.findByPlaceholderText("Select a semantic type")
        .should("have.value", "No semantic type")
        .click();
      searchAndSelectValue("Currency");
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Tax");
      cy.findByPlaceholderText("Select a currency type").should("be.visible");

      cy.findByPlaceholderText("Select a currency type")
        .should("have.value", "US Dollar")
        .click();
      searchAndSelectValue("Canadian Dollar");
      cy.wait("@updateField");

      H.openOrdersTable();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Tax (CA$)").should("be.visible");
    });

    it("should allow changing the field foreign key target", () => {
      visitFieldMetadata({ fieldId: ORDERS.USER_ID });
      cy.findByPlaceholderText("Select a target")
        .should("have.value", "People → ID")
        .click();
      H.popover().findByText("Products → ID").click();
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated User ID");
      cy.findByPlaceholderText("Select a target")
        .should("have.value", "Products → ID")
        .should("be.visible");

      H.openTable({
        database: SAMPLE_DB_ID,
        table: ORDERS_ID,
        mode: "notebook",
      });
      cy.icon("join_left_outer").click();
      H.entityPickerModal().within(() => {
        H.entityPickerModalTab("Tables").click();
        cy.findByText("Products").click();
      });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("User ID").should("be.visible");
    });

    it("should allow you to cast a field to a data type", () => {
      visitFieldMetadata({ fieldId: FEEDBACK.RATING });
      cy.findByRole("button", { name: /Don't cast/ }).click();

      cy.log(
        "Ensure that Coercion strategy has been humanized (metabase#44723)",
      );
      H.popover().should("not.contain.text", "Coercion");
      H.popover().findByText("UNIX seconds → Datetime").click();
      cy.wait("@updateField");

      H.openTable({ database: SAMPLE_DB_ID, table: FEEDBACK_ID });
      cy.findAllByTestId("cell-data")
        .contains("December 31, 1969, 4:00 PM")
        .should("have.length.greaterThan", 0);
    });
  });

  describe("data model permissions", () => {
    beforeEach(() => {
      H.restore();
      cy.signInAsAdmin();
      H.activateToken("pro-self-hosted");
    });

    it("should allow changing the table name with data model permissions only", () => {
      setDataModelPermissions({ tableIds: [ORDERS_ID] });

      cy.signIn("none");
      visitTableMetadata();
      setValueAndBlurInput("Orders", "New orders");
      cy.findByDisplayValue("New orders").should("be.visible");
      H.undoToast().should("contain.text", "Updated Table display_name");
      cy.wait("@updateTable");
      cy.signOut();

      cy.signInAsNormalUser();
      H.startNewQuestion();
      H.entityPickerModal().within(() => {
        H.entityPickerModalTab("Tables").click();
        cy.findByText("People").should("be.visible");
        cy.findByText("New orders").should("be.visible");
      });
    });

    it("should allow changing the field name with data model permissions only in table settings", () => {
      setDataModelPermissions({ tableIds: [ORDERS_ID] });

      cy.signIn("none");
      visitTableMetadata();
      getFieldSection("TAX").within(() =>
        setValueAndBlurInput("Tax", "New tax"),
      );
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Tax");
      getFieldSection("TAX").findByDisplayValue("New tax").should("be.visible");

      cy.signInAsNormalUser();
      H.openOrdersTable();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("New tax").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Tax").should("not.exist");
    });

    it("should allow changing the field name with data model permissions only in field settings", () => {
      setDataModelPermissions({ tableIds: [ORDERS_ID] });

      cy.signIn("none");
      visitFieldMetadata({ fieldId: ORDERS.TOTAL });
      setValueAndBlurInput("Total", "New total");
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated Total");
      cy.findByDisplayValue("New total").should("be.visible");

      cy.signInAsNormalUser();
      H.openOrdersTable();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("New total").should("be.visible");
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Total").should("not.exist");
    });

    it("should allow changing the field foreign key target", () => {
      setDataModelPermissions({
        tableIds: [ORDERS_ID, PRODUCTS_ID, PEOPLE_ID],
      });

      cy.signIn("none");
      visitFieldMetadata({ fieldId: ORDERS.USER_ID });
      cy.findByPlaceholderText("Select a target")
        .should("have.value", "People → ID")
        .click();
      H.popover().within(() => {
        cy.findByText("Reviews → ID").should("not.exist");
        cy.findByText("Products → ID").click();
      });
      cy.wait("@updateField");
      H.undoToast().should("contain.text", "Updated User ID");
      cy.findByPlaceholderText("Select a target")
        .should("have.value", "Products → ID")
        .and("be.visible");

      cy.signInAsNormalUser();
      H.openTable({
        database: SAMPLE_DB_ID,
        table: ORDERS_ID,
        mode: "notebook",
      });
      cy.icon("join_left_outer").click();
      H.entityPickerModal().within(() => {
        H.entityPickerModalTab("Tables").click();
        cy.findByText("Products").click();
      });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("User ID").should("be.visible");
    });

    it("should allow setting foreign key mapping for accessible tables", () => {
      setDataModelPermissions({
        tableIds: [ORDERS_ID, REVIEWS_ID, PRODUCTS_ID],
      });

      cy.signIn("none");
      visitFieldMetadata({ tableId: REVIEWS_ID, fieldId: REVIEWS.PRODUCT_ID });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Use original value").click();
      H.popover().findByText("Use foreign key").click();
      H.popover().findByText("Title").click();
      cy.wait("@updateFieldDimension");

      cy.signInAsNormalUser();
      H.openReviewsTable({ limit: 1 });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Rustic Paper Wallet").should("be.visible");
    });

    it("should now allow setting foreign key mapping for inaccessible tables", () => {
      setDataModelPermissions({ tableIds: [REVIEWS_ID] });

      cy.signIn("none");
      visitFieldMetadata({ tableId: REVIEWS_ID, fieldId: REVIEWS.PRODUCT_ID });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Use original value").click();
      H.popover().within(() => {
        cy.findByText("Use original value").should("be.visible");
        cy.findByText("Use foreign key").should("not.exist");
      });
    });

    it("should show a proper error message when using custom mapping", () => {
      setDataModelPermissions({ tableIds: [REVIEWS_ID] });

      cy.signIn("none");
      visitFieldMetadata({ tableId: REVIEWS_ID, fieldId: REVIEWS.RATING });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Use original value").click();
      H.popover().within(() => {
        cy.findByText("Use original value").should("be.visible");
        cy.findByText("Custom mapping").should("not.exist");
      });

      cy.signInAsAdmin();
      visitFieldMetadata({ tableId: REVIEWS_ID, fieldId: REVIEWS.RATING });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Use original value").click();
      H.popover().findByText("Custom mapping").click();
      cy.wait("@updateFieldDimension");

      cy.signIn("none");
      visitFieldMetadata({ tableId: REVIEWS_ID, fieldId: REVIEWS.RATING });
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText("Custom mapping").click();
      // eslint-disable-next-line no-unscoped-text-selectors -- deprecated usage
      cy.findByText(CUSTOM_MAPPING_ERROR).should("be.visible");
    });
  });

  describe("databases without schemas", { tags: ["@external"] }, () => {
    beforeEach(() => {
      H.restore("mysql-8");
      cy.signInAsAdmin();
    });

    it("should be able to select and update a table in a database without schemas", () => {
      visitTableMetadata({
        databaseId: MYSQL_DB_SCHEMA_ID,
        schemaId: MYSQL_DB_SCHEMA_ID,
      });
      setValueAndBlurInput("Orders", "New orders");
      cy.wait("@updateTable");
      cy.findByDisplayValue("New orders").should("be.visible");
    });

    it("should be able to select and update a field in a database without schemas", () => {
      visitTableMetadata({
        databaseId: MYSQL_DB_SCHEMA_ID,
        schemaId: MYSQL_DB_SCHEMA_ID,
      });
      getFieldSection("TAX").findByDisplayValue("Everywhere").click();
      H.popover().findByText("Do not include").click();
      cy.wait("@updateField");
      getFieldSection("TAX")
        .findByDisplayValue("Do not include")
        .should("be.visible");
    });
  });
});

const setDataModelPermissions = ({ tableIds = [] }) => {
  const permissions = Object.fromEntries(tableIds.map((id) => [id, "all"]));

  cy.updatePermissionsGraph({
    [ALL_USERS_GROUP]: {
      [SAMPLE_DB_ID]: {
        "data-model": {
          schemas: {
            PUBLIC: permissions,
          },
        },
      },
    },
  });
};

const visitTableMetadata = ({
  databaseId = SAMPLE_DB_ID,
  schemaId = SAMPLE_DB_SCHEMA_ID,
  tableId = ORDERS_ID,
} = {}) => {
  cy.visit(
    `/admin/datamodel/database/${databaseId}/schema/${schemaId}/table/${tableId}`,
  );
  cy.wait("@fetchMetadata");
};

const visitFieldMetadata = ({
  databaseId = SAMPLE_DB_ID,
  schemaId = SAMPLE_DB_SCHEMA_ID,
  tableId = ORDERS_ID,
  fieldId,
}) => {
  cy.visit(
    `/admin/datamodel/database/${databaseId}/schema/${schemaId}/table/${tableId}/field/${fieldId}`,
  );
  cy.wait("@fetchMetadata");
};

const setValueAndBlurInput = (oldValue, newValue) => {
  cy.findByDisplayValue(oldValue).clear().type(newValue).blur();
};

const clearAndBlurInput = (oldValue) => {
  cy.findByDisplayValue(oldValue).clear().blur();
};

const searchAndSelectValue = (newValue, searchText = newValue) => {
  H.popover().findByText(newValue).click();
};

const getFieldSection = (fieldName) => {
  return cy.findByLabelText(fieldName);
};

const verifyTableOrder = (order) => {
  cy.findByLabelText("Edit column order").click();
  H.modal().findByLabelText("Sort").should("have.text", order);
};

const setTableOrder = (order) => {
  H.modal().findByLabelText("Sort").click();
  H.popover().findByText(order).click();
  cy.wait("@updateTable");
};

const assertTableHeader = (columns) => {
  cy.findAllByTestId("header-cell").should("have.length", columns.length);

  columns.forEach((column, index) => {
    // eslint-disable-next-line no-unsafe-element-filtering
    cy.findAllByTestId("header-cell").eq(index).should("have.text", column);
  });
};
