/* eslint-disable ttag/no-module-declaration -- see metabase#55045 */
/* eslint-disable react/prop-types */
import cx from "classnames";
import { Component, createRef } from "react";
import { t } from "ttag";
import _ from "underscore";

import ButtonWithStatus from "metabase/common/components/ButtonWithStatus";
import Select from "metabase/common/components/Select";
import CS from "metabase/css/core/index.css";
import Fields from "metabase/entities/fields";
import { connect } from "metabase/lib/redux";
import { PLUGIN_FEATURE_LEVEL_PERMISSIONS } from "metabase/plugins";
import { FieldDataSelector } from "metabase/query_builder/components/DataSelector";
import { getMetadataUnfiltered } from "metabase/selectors/metadata";
import { isEntityName, isFK } from "metabase-lib/v1/types/utils/isa";

import FieldSeparator from "../FieldSeparator";

import {
  FieldMappingContainer,
  FieldMappingRoot,
  FieldSelectButton,
  FieldValueMappingInput,
} from "./FieldRemappingSettings.styled";

const MAP_OPTIONS = {
  original: { type: "original", name: t`Use original value` },
  foreign: { type: "foreign", name: t`Use foreign key` },
  custom: { type: "custom", name: t`Custom mapping` },
};

class FieldRemappingSettings extends Component {
  state = {
    isChoosingInitialFkTarget: false,
    dismissedInitialFkTargetPopover: false,
  };

  constructor(props, context) {
    super(props, context);

    this.fkPopover = createRef();
  }

  getMappingTypeForField = (field) => {
    if (this.state.isChoosingInitialFkTarget) {
      return MAP_OPTIONS.foreign;
    }

    if (_.isEmpty(field.dimensions)) {
      return MAP_OPTIONS.original;
    }
    if (field.dimensions[0]?.type === "external") {
      return MAP_OPTIONS.foreign;
    }
    if (field.dimensions[0]?.type === "internal") {
      return MAP_OPTIONS.custom;
    }

    throw new Error(t`Unrecognized mapping type`);
  };

  hasForeignKeyTargetFields = () => {
    return (
      isFK(this.props.field) && this.getForeignKeyTargetFields().length > 0
    );
  };

  hasMappableNumeralValues = () => {
    const { field } = this.props;
    const remapping = new Map(field.remappedValues());

    // Only show the "custom" option if we have some values that can be mapped to user-defined custom values
    // (for a field without user-defined remappings, every key of `field.remappings` has value `undefined`)
    return (
      remapping.size > 0 &&
      [...remapping.keys()].every(
        (key) => typeof key === "number" || key === null,
      )
    );
  };

  getAvailableMappingTypes = () => {
    const mappingTypes = [
      MAP_OPTIONS.original,
      ...(this.hasForeignKeyTargetFields() ? [MAP_OPTIONS.foreign] : []),
      ...(this.hasMappableNumeralValues() > 0 ? [MAP_OPTIONS.custom] : []),
    ];

    const selectedType = this.getMappingTypeForField(this.props.field);

    if (!mappingTypes.includes(selectedType)) {
      mappingTypes.push(selectedType);
    }

    return mappingTypes;
  };

  getFKTargetTableEntityNameOrNull = () => {
    const fkTargetFields = this.getForeignKeyTargetFields();
    const nameField = fkTargetFields.find((field) => isEntityName(field));
    return nameField ? nameField.id : null;
  };

  clearEditingStates = () => {
    this.setState({
      isChoosingInitialFkTarget: false,
      dismissedInitialFkTargetPopover: false,
    });
  };

  handleChangeMappingType = async ({ target: { value: mappingType } }) => {
    const { field, updateFieldDimension, deleteFieldDimension } = this.props;

    this.clearEditingStates();

    if (mappingType.type === "original") {
      await deleteFieldDimension({ id: field.id });
      this.setState({ hasChanged: false });
    } else if (mappingType.type === "foreign") {
      // Try to find a entity name field from target table and choose it as remapping target field if it exists
      const entityNameFieldId = this.getFKTargetTableEntityNameOrNull();

      if (entityNameFieldId) {
        await updateFieldDimension(
          { id: field.id },
          {
            type: "external",
            name: field.display_name,
            human_readable_field_id: entityNameFieldId,
          },
        );
      } else {
        // Enter a special state where we are choosing an initial value for FK target
        this.setState({
          hasChanged: true,
          isChoosingInitialFkTarget: true,
        });
      }
    } else if (mappingType.type === "custom") {
      await updateFieldDimension(
        { id: field.id },
        {
          type: "internal",
          name: field.display_name,
          human_readable_field_id: null,
        },
      );
      this.setState({ hasChanged: true });
    } else {
      throw new Error(t`Unrecognized mapping type`);
    }
  };

  onForeignKeyFieldChange = async (fkFieldId) => {
    const { field, updateFieldDimension } = this.props;

    this.clearEditingStates();

    await updateFieldDimension(
      { id: field.id },
      {
        type: "external",
        name: field.display_name,
        human_readable_field_id: fkFieldId,
      },
    );
    this.fkPopover.current?.close();
  };

  onUpdateRemappings = (remappings) => {
    const { field, updateFieldValues } = this.props;
    return updateFieldValues({ id: field.id }, Array.from(remappings));
  };

  getForeignKeyTargetFields = () => {
    const { fkTargetField } = this.props;
    return fkTargetField?.table?.fields ?? [];
  };

  render() {
    const { field, table, metadata, fieldsError, fkTargetField } = this.props;
    const { hasChanged, isChoosingInitialFkTarget } = this.state;

    const remapping = new Map(field.remappedValues());
    const isFieldsAccessRestricted = fieldsError?.status === 403;

    const mappingType = this.getMappingTypeForField(field);
    const isFKMapping = mappingType === MAP_OPTIONS.foreign;
    const hasFKMappingValue =
      isFKMapping && field.dimensions?.[0]?.human_readable_field_id !== null;
    const fkMappingField =
      hasFKMappingValue &&
      metadata.field(field.dimensions?.[0]?.human_readable_field_id);

    return (
      <div>
        <FieldMappingContainer>
          <Select
            value={mappingType}
            onChange={this.handleChangeMappingType}
            options={this.getAvailableMappingTypes()}
            optionValueFn={(o) => o}
            className={CS.inlineBlock}
          />
          {mappingType === MAP_OPTIONS.foreign && (
            <>
              <FieldSeparator />
              <FieldDataSelector
                isInitiallyOpen={isChoosingInitialFkTarget}
                databases={table?.database ? [table.database] : []}
                selectedDatabase={table?.database}
                selectedDatabaseId={table?.database?.id}
                selectedTable={fkTargetField?.table}
                selectedTableId={fkTargetField?.table?.id}
                selectedField={fkMappingField}
                selectedFieldId={fkMappingField?.id}
                triggerElement={
                  <FieldSelectButton
                    hasValue={hasFKMappingValue}
                    hasError={!fkMappingField}
                  >
                    {fkMappingField ? (
                      fkMappingField.display_name
                    ) : (
                      <span className={CS.textMedium}>{t`Choose a field`}</span>
                    )}
                  </FieldSelectButton>
                }
                setFieldFn={this.onForeignKeyFieldChange}
              />
            </>
          )}
        </FieldMappingContainer>
        {hasChanged && hasFKMappingValue && <RemappingNamingTip />}
        {mappingType === MAP_OPTIONS.custom &&
          (isFieldsAccessRestricted ? (
            <div className={cx(CS.pt2, CS.textError)}>
              {t`You need unrestricted data access on this table to map custom display values.`}
            </div>
          ) : (
            <div className={CS.mt3}>
              {hasChanged && <RemappingNamingTip />}
              <ValueRemappings
                remappings={remapping}
                updateRemappings={this.onUpdateRemappings}
              />
            </div>
          ))}
      </div>
    );
  }
}

// consider renaming this component to something more descriptive
class ValueRemappings extends Component {
  state = {
    editingRemappings: new Map(),
  };

  componentDidMount() {
    this._updateEditingRemappings(this.props.remappings);
  }

  componentDidUpdate(prevProps) {
    const { remappings } = this.props;
    if (
      !(
        // check if the Maps are different
        (
          prevProps.remappings &&
          remappings &&
          prevProps.remappings.size === remappings.size &&
          [...remappings].every(([k, v]) => prevProps.remappings.get(k) === v)
        )
      )
    ) {
      this._updateEditingRemappings(remappings);
    }
  }

  _updateEditingRemappings(remappings) {
    const editingRemappings = new Map(
      [...remappings].map(([original, mappedOrUndefined]) => {
        // Use currently the original value as the "default custom mapping" as the current backend implementation
        // requires that all original values must have corresponding mappings

        // Additionally, the defensive `.toString` ensures that the mapped value definitely will be string
        const mappedString =
          mappedOrUndefined !== undefined
            ? mappedOrUndefined.toString()
            : original === null
              ? "null"
              : original.toString();

        return [original, mappedString];
      }),
    );

    const containsUnsetMappings = [...remappings].some(
      ([_, mappedOrUndefined]) => {
        return mappedOrUndefined === undefined;
      },
    );
    if (containsUnsetMappings) {
      // Save the initial values to make sure that we aren't left in a potentially broken state where
      // the dimension type is "internal" but we don't have any values in metabase_fieldvalues
      this.props.updateRemappings(editingRemappings);
    }
    this.setState({ editingRemappings });
  }

  onSetRemapping(original, newMapped) {
    this.setState({
      editingRemappings: new Map([
        ...this.state.editingRemappings,
        [original, newMapped],
      ]),
    });
  }

  onSaveClick = () => {
    // Returns the promise so that ButtonWithStatus can show the saving status
    return this.props.updateRemappings(this.state.editingRemappings);
  };

  customValuesAreNonEmpty = () => {
    return Array.from(this.state.editingRemappings.values()).every(
      (value) => value !== "",
    );
  };

  render() {
    const { editingRemappings } = this.state;

    return (
      <FieldMappingRoot>
        <div
          className={cx(
            CS.flex,
            CS.alignCenter,
            CS.my1,
            CS.pb2,
            CS.borderBottom,
          )}
        >
          <h3>{t`Original value`}</h3>
          <h3 className={CS.mlAuto}>{t`Mapped value`}</h3>
        </div>
        <ol>
          {[...editingRemappings].map(([original, mapped]) => (
            <li key={original} className={CS.mb1}>
              <FieldValueMapping
                original={original}
                mapped={mapped}
                setMapping={(newMapped) =>
                  this.onSetRemapping(original, newMapped)
                }
              />
            </li>
          ))}
        </ol>
        <div className={cx(CS.flex, CS.alignCenter)}>
          <ButtonWithStatus
            className={CS.mlAuto}
            disabled={!this.customValuesAreNonEmpty()}
            onClickOperation={this.onSaveClick}
          >
            {t`Save`}
          </ButtonWithStatus>
        </div>
      </FieldMappingRoot>
    );
  }
}

class FieldValueMapping extends Component {
  onInputChange = (e) => {
    this.props.setMapping(e.target.value);
  };

  render() {
    const { original, mapped } = this.props;
    return (
      <div className={cx(CS.flex, CS.alignCenter)}>
        <h3>{original}</h3>
        <FieldValueMappingInput
          className={CS.mlAuto}
          value={mapped}
          onChange={this.onInputChange}
          placeholder={t`Enter value`}
        />
      </div>
    );
  }
}

const RemappingNamingTip = () => (
  <div
    className={cx(
      CS.bordered,
      CS.rounded,
      CS.p1,
      CS.mt1,
      CS.mb2,
      CS.borderBrand,
    )}
  >
    <span className={cx(CS.textBrand, CS.textBold)}>{t`Tip: `}</span>
    {t`You might want to update the field name to make sure it still makes sense based on your remapping choices.`}
  </div>
);

const mapStateToProps = (state, { field }) => ({
  metadata: getMetadataUnfiltered(state),
  fieldsError: Fields.selectors.getError(state, {
    entityId: field.id,
    requestType: "values",
  }),
});

const mapDispatchToProps = {
  updateFieldValues: Fields.actions.updateFieldValues,
  updateFieldDimension: Fields.actions.updateFieldDimension,
  deleteFieldDimension: Fields.actions.deleteFieldDimension,
};

export default _.compose(
  Fields.load({
    id: (_state, { field }) => field.fk_target_field_id,
    entityAlias: "fkTargetField",
    query: PLUGIN_FEATURE_LEVEL_PERMISSIONS.dataModelQueryProps,
    loadingAndErrorWrapper: false,
  }),
  connect(mapStateToProps, mapDispatchToProps),
)(FieldRemappingSettings);
