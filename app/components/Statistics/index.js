// @flow
import AutoComplete from 'material-ui/AutoComplete';
import React, { Component, PropTypes } from 'react';
import { connect } from '../../actions';

import AdminLogin from '../Login';
import { INFO_OBJECT_ID, findIntoDatabase } from '../../api/database';
import StatisticsTable from './Table';
import SaveAs from '../SaveAs';

import { format as dateFormat } from '../../config/date.json';

const BASE_FILTER = {
  $and: [{
    $not: {
      _id: INFO_OBJECT_ID
    }
  }, {
    $not: {
      isDeleted: true
    }
  }]
};

class Statistics extends Component {

  static propTypes = {
    i18n: PropTypes.func,
    auth: PropTypes.bool,
    setFilter: PropTypes.func,
    errorLog: PropTypes.func,
    locale: PropTypes.string
  };

  state = {
    data: [],
    dataSource: []
  };

  componentDidMount() {
    this.setSearchValue();
  }

  componentWillReceiveProps(nextProps) {
    const { statistics } = nextProps;
    const { filter, sort } = statistics;
    this.getQuestionnaires(filter, { sort });
  }

  getQuestionnaires(...options) {
    const { errorLog } = this.props;

    return findIntoDatabase(...options)
      .then(questionnaires => {
        const patients = {};
        questionnaires.forEach(qst => {
          if (typeof qst.patient !== 'string' && patients[qst.patient]) {
            return false;
          }
          patients[qst.patient] = qst;
        });
        this.setState({
          data: questionnaires,
          dataSource: Object.keys(patients)
        });
        return true;
      })
      .catch(err => {
        errorLog(err);
      });
  }

  setSearchValue(value) {
    const { setFilter } = this.props;
    const filter = Object.assign({}, BASE_FILTER);
    if (value) {
      filter.patient = { $regex: new RegExp(value) };
    }
    setFilter(filter);
  }

  render() {
    const { i18n, auth, locale } = this.props;
    const { data } = this.state;

    const exportDate = new global.Intl
      .DateTimeFormat(locale, dateFormat.date)
      .format(new Date());

    const dataMarkup = (
      <div>
        <AutoComplete
          hintText={i18n('statistics-filter-patient-hint')}
          floatingLabelText={i18n('statistics-filter-patient-label')}
          floatingLabelFixed={true}
          dataSource={this.state.dataSource}
          onUpdateInput={value => this.setSearchValue(value)}
        />
        {data.length > 0 ?
          <div>
            <SaveAs
              exportData={data}
              fileName={`cfqr-app-full-export-${exportDate}`}
              style={{ float: 'right' }}
            />
            <StatisticsTable rowUrl="questionnaire" urlId="_id" rows={data} />
          </div> :
          <div>{i18n('no-data')}</div>}
      </div>
    );

    if (!auth) {
      return (<AdminLogin />);
    }

    return (dataMarkup);
  }
}

export default connect(Statistics);
