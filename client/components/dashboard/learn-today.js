import React, { Component } from 'react';
import { fetchCategories } from '../../store';
import { CategoryCard } from '../../components';
import { connect } from 'react-redux';

class LearnToday extends Component {
  componentDidMount() {
    this.props.getCategories();
  }

  render() {
    const { categories, isLoading, firstName } = this.props;

    if (isLoading) return null;
    else
      return (
        <div className="box">
          <h1 className="title">
            What would you like to learn today, {firstName}?
          </h1>

          <div className="columns">
            {categories.map(category => (
              <CategoryCard key={category.id} {...category} />
            ))}
          </div>
        </div>
      );
  }
}

const mapState = state => ({
  categories: state.categories.all,
  isLoading: state.categories.isLoading,
  firstName: state.me.firstName
});

const mapDispatch = dispatch => ({
  getCategories: () => dispatch(fetchCategories())
});

export default connect(mapState, mapDispatch)(LearnToday);