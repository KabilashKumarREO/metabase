/* eslint "react/prop-types": "warn" */
import cx from "classnames";
import PropTypes from "prop-types";
import { Component } from "react";

import SidebarLayout from "metabase/common/components/SidebarLayout";
import CS from "metabase/css/core/index.css";
import { connect } from "metabase/lib/redux";
import * as metadataActions from "metabase/redux/metadata";
import * as actions from "metabase/reference/reference";
import SegmentFieldList from "metabase/reference/segments/SegmentFieldList";

import {
  getIsEditing,
  getSegment,
  getSegmentId,
  getTable,
  getUser,
} from "../selectors";

import SegmentSidebar from "./SegmentSidebar";

const mapStateToProps = (state, props) => ({
  user: getUser(state, props),
  segment: getSegment(state, props),
  segmentId: getSegmentId(state, props),
  table: getTable(state, props),
  isEditing: getIsEditing(state, props),
});

const mapDispatchToProps = {
  ...metadataActions,
  ...actions,
};

class SegmentFieldListContainer extends Component {
  static propTypes = {
    params: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    databaseId: PropTypes.number.isRequired,
    user: PropTypes.object.isRequired,
    segment: PropTypes.object.isRequired,
    segmentId: PropTypes.number.isRequired,
    isEditing: PropTypes.bool,
  };

  async fetchContainerData() {
    await actions.wrappedFetchSegmentFields(this.props, this.props.segmentId);
  }

  UNSAFE_componentWillMount() {
    this.fetchContainerData();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (this.props.location.pathname === newProps.location.pathname) {
      return;
    }

    actions.clearState(newProps);
  }

  render() {
    const { user, segment, isEditing } = this.props;

    return (
      <SidebarLayout
        className={cx(CS.flexFull, CS.relative)}
        style={isEditing ? { paddingTop: "43px" } : {}}
        sidebar={<SegmentSidebar segment={segment} user={user} />}
      >
        <SegmentFieldList {...this.props} />
      </SidebarLayout>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SegmentFieldListContainer);
