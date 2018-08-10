import React from 'react';
import { connect } from 'react-redux';
import { fetchUser } from '../../store/';

const CurrentTopics = ({ viewedUser }) => {
  const { topics } = viewedUser;

  return (
    <div style={{ width: 400 }}>
      <div className="card">
        <div className="card-content">
          <p className="title is-4">Current Topics: </p>
          <p />
          {topics.map(topic => (
            <p className="subtitle is-5" key={topic.id}>
              {topic.userTopic.proficiency} at {topic.name}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

const mapState = state => ({
  viewedUser: state.users.active
});

export default connect(mapState)(CurrentTopics);