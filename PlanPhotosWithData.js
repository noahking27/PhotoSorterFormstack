import { graphql, compose } from 'react-apollo'
import PlanPhotos from '../presentations/PlanPhotos'
import { PLAN_INTERIOR_PHOTOS_QUERY, PLAN_EXTERIOR_PHOTOS_QUERY } from '../../../graphql/Plans.graphql'

import {
  DELETE_PLAN_EXT_PHOTO,
  DELETE_PLAN_INT_PHOTO,
  UPDATE_PLAN_PHOTO_SORT,
  ADD_PLAN_PHOTO,
} from '../../../graphql/PlansMutations.graphql'
import generateUrl from '../../../utils/urlGenerator'

export default compose(
  graphql(PLAN_INTERIOR_PHOTOS_QUERY, {
    options: ({ clientName, planId }) => ({ variables: { clientName, planId } }),
    props: ({ data: { loading, planInteriorPhotos }, ownProps }) => {
      // Iterate over each photo and create the image url
      const planIntPhotos = loading ? [] : planInteriorPhotos.map((element) => {
        const urlIntPhoto = generateUrl(ownProps.clientName, 'planIntPhotos', undefined, ownProps.planId) + element.src

        const revisedIntPhotos = {
          src: urlIntPhoto,
          sortIndex: element.sortIndex,
          width: 0,
          height: 0,
        }

        return revisedIntPhotos
      })
      return ({ isGraphQlLoadingPlanIntPhotos: loading, planIntPhotos })
    },
  }),
  graphql(PLAN_EXTERIOR_PHOTOS_QUERY, {
    options: ({ clientName, planId }) => ({ variables: { clientName, planId } }),
    props: ({ data: { loading, planExteriorPhotos }, ownProps }) => {
      // Iterate over each photo and create the image url
      const planExtPhotos = loading ? [] : planExteriorPhotos.map((element) => {
        const urlExtPhoto = generateUrl(ownProps.clientName, 'planExtPhotos', undefined, ownProps.planId) + element.src

        const revisedExtPhotos = {
          src: urlExtPhoto,
          sortIndex: element.sortIndex,
          width: 0,
          height: 0,
        }

        return revisedExtPhotos
      })
      return ({ isGraphQlLoadingPlanExtPhotos: loading, planExtPhotos })
    },
  }),
  graphql(DELETE_PLAN_EXT_PHOTO, {
    props: ({ mutate, ownProps }) => ({
      onDeletePlanExtPhoto: (src, sortIndex) =>
        mutate({
          variables: { clientName: ownProps.clientName, planId: ownProps.planId, src, sortIndex },
          refetchQueries: [{
            query: PLAN_EXTERIOR_PHOTOS_QUERY,
            variables: { clientName: ownProps.clientName, planId: ownProps.planId },
          }],
        }),
    }),
  }),
  graphql(DELETE_PLAN_INT_PHOTO, {
    props: ({ mutate, ownProps }) => ({
      onDeletePlanIntPhoto: (src, sortIndex) =>
        mutate({
          variables: { clientName: ownProps.clientName, planId: ownProps.planId, src, sortIndex },
          refetchQueries: [{
            query: PLAN_INTERIOR_PHOTOS_QUERY,
            variables: { clientName: ownProps.clientName, planId: ownProps.planId },
          }],
        }),
    }),
  }),
  graphql(UPDATE_PLAN_PHOTO_SORT, {
    options: ({ clientName, planId }) => ({
      refetchQueries: [
        {
          query: PLAN_INTERIOR_PHOTOS_QUERY,
          variables: { clientName, planId },
        },
        {
          query: PLAN_EXTERIOR_PHOTOS_QUERY,
          variables: { clientName, planId },
        },
      ],
    }),
    props: ({ mutate, ownProps }) => ({
      updatePlanPhotoSort: (sortOrder, table) =>
        mutate({
          variables: {
            clientName: ownProps.clientName,
            planId: ownProps.planId,
            sortOrder,
            table,
          },
        }),
    }),
  }),
  graphql(ADD_PLAN_PHOTO, {
    options: ({ clientName, planId }) => ({
      refetchQueries: [
        {
          query: PLAN_INTERIOR_PHOTOS_QUERY,
          variables: { clientName, planId },
        },
        {
          query: PLAN_EXTERIOR_PHOTOS_QUERY,
          variables: { clientName, planId },
        },
      ],
    }),
    props: ({ mutate, ownProps }) => ({
      addPlanPhoto: (src, table) =>
        mutate({
          variables: {
            clientName: ownProps.clientName,
            planId: ownProps.planId,
            src,
            table,
          },
        }),
    }),
  }),
)(PlanPhotos)
