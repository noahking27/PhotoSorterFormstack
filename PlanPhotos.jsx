import React, { Component } from 'react'
import Gallery from 'react-photo-gallery'
import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc'
import { StyleSheet, css } from 'aphrodite'
import PropTypes from 'prop-types'
import { Tag, Collapse, Row, Col, Button, Popconfirm, message } from 'antd'
import DropZone from '../../common/presentations/DropZone'
import { getLogger } from '../../../utils/'

const log = getLogger('PlanPhotos')
const { Panel } = Collapse

const styles = StyleSheet.create({
  imgStyle: {
    display: 'block',
    height: '160px',
    width: 'auto',
  },
  tag: {
    position: 'absolute',
  },
  header: {
    marginTop: '5px',
    paddingLeft: '12px',
  },
  deleteImg: {
    position: 'absolute',
    right: '0px',
  },
  collapse: {
    fontSize: '20px',
    fontWeight: '500',
    marginBottom: '2em',
  },
  dragger: {
    height: '10em',
    paddingRight: '10px',
  },
})

class PlanPhotos extends Component {
  static propTypes = {
    clientName: PropTypes.string.isRequired,
    planIntPhotos: PropTypes.arrayOf(PropTypes.object).isRequired,
    planExtPhotos: PropTypes.arrayOf(PropTypes.object).isRequired,
    addPlanPhoto: PropTypes.func.isRequired,
    onDeletePlanExtPhoto: PropTypes.func.isRequired,
    onDeletePlanIntPhoto: PropTypes.func.isRequired,
    updatePlanPhotoSort: PropTypes.func.isRequired,
  }

  static getDerivedStateFromProps(nextProps) {
    return {
      extPhotos: nextProps.planExtPhotos,
      intPhotos: nextProps.planIntPhotos,
    }
  }

  constructor(props) {
    super(props)
    this.sortExtPhotos = this.sortExtPhotos.bind(this)
    this.sortIntPhotos = this.sortIntPhotos.bind(this)
    this.state = {
      extPhotos: [],
      intPhotos: [],
    }
  }

  deleteImg = (img, type) => () => {
    const { sortIndex } = img
    // Remove the image url to cloudinary before sending to the database
    const imgNoUrl = img.src.split('/').pop()
    const deleteFunction = (type === 'Exterior') ?
      this.props.onDeletePlanExtPhoto
      :
      this.props.onDeletePlanIntPhoto

    deleteFunction(imgNoUrl, sortIndex).then(() => {
      message.success('Plan photo deleted!')
    }).catch(() => {
      message.error('ERROR! Plan photo not deleted!')
    })
  }

  sortExtPhotos({ oldIndex, newIndex }) {
    this.setState({
      extPhotos: arrayMove(this.state.extPhotos, oldIndex, newIndex),
    })
    this.changePhotosSortIndex('exterior')
  }

  sortIntPhotos({ oldIndex, newIndex }) {
    this.setState({
      intPhotos: arrayMove(this.state.intPhotos, oldIndex, newIndex),
    })
    this.changePhotosSortIndex('interior')
  }

  changePhotosSortIndex = (table) => {
    const currentSort = table === 'exterior' ? this.state.extPhotos : this.state.intPhotos
    const newSortIndexArray = []
    // Retrieve the index of each photo and add one to it
    // Then remove the cloudinary url and push the images with the new sort order
    // to the array and then send it off through graphql to postgres
    currentSort.map((element) => {
      const newSortIndex = currentSort.indexOf(element) + 1
      const photo = element.src.split('/').pop()
      return newSortIndexArray.push({ src: photo, sortIndex: newSortIndex })
    })
    this.props.updatePlanPhotoSort(newSortIndexArray, table)
  }

  handlePostAddUpload = (response, table) => {
    if (!response.length || !response[0].fileName) {
      return
    }

    this.props.addPlanPhoto(response[0].fileName, table).then(() => {
      message.success(`Added photo ${response[0].fileName}`)
    }).catch((err) => {
      log.error(`Failed to add photo ${response[0].fileName}.`, err)
      message.error(`Failed to add photo ${response[0].fileName}.`)
    })
  }

  generateDropzone = (table) => {
    const dropZoneProps = {
      // accept: '.jpg, .jpeg, .png', silent rejection
      // for now, clientDirName is using client.altName,
      // but it should use client.directoryName once we store that value in redux
      data: { tgtDir: 'images/', clientDirName: this.props.clientName },
      dropzoneMinHeight: '150px',
    }

    dropZoneProps.postUpload = response => this.handlePostAddUpload(response, table)

    return (
      <div className={css(styles.dragger)}>
        <DropZone imgStyle={styles.dropzoneImg} {...dropZoneProps} />
      </div>
    )
  }

  render() {
    const cont = {
      backgroundColor: '#eee',
      cursor: 'pointer',
      overflow: 'hidden',
      float: 'left',
      position: 'relative',
      margin: '5px',
    }

    const generateExtImgs = planImg =>
      (
        <div style={{ ...cont }}>
          <Tag color="#FF0000" className={css(styles.tag)}>{planImg.photo.sortIndex}</Tag>
          <Popconfirm
            placement="bottomRight"
            title="Delete exterior photo?"
            onConfirm={this.deleteImg(planImg.photo, 'Exterior')}
            okText="Yes"
            cancelText="No"
          >
            <Button className={css(styles.deleteImg)} type="danger" icon="delete" />
          </Popconfirm>
          <img src={planImg.photo.src} width={0} height={0} className={css(styles.imgStyle)} alt="Plan Photos" />
        </div>
      )

    const generateIntImgs = planImg =>
      (
        <div style={{ ...cont }}>
          <Tag color="#FF0000" className={css(styles.tag)}>{planImg.photo.sortIndex}</Tag>
          <Popconfirm
            placement="bottomRight"
            title="Delete interior photo?"
            onConfirm={this.deleteImg(planImg.photo, 'Interior')}
            okText="Yes"
            cancelText="No"
          >
            <Button className={css(styles.deleteImg)} type="danger" icon="delete" />
          </Popconfirm>
          <img src={planImg.photo.src} width={0} height={0} className={css(styles.imgStyle)} alt="Plan Photos" />
        </div>
      )

    const SortableExtPhoto = SortableElement(generateExtImgs)
    const SortableIntPhoto = SortableElement(generateIntImgs)

    const ExtPhotoGallery = SortableContainer(() =>
      (
        <Gallery
          photos={this.state.extPhotos}
          ImageComponent={SortableExtPhoto}
        />
      ),
    )
    const IntPhotoGallery = SortableContainer(() =>
      (
        <Gallery
          photos={this.state.intPhotos}
          ImageComponent={SortableIntPhoto}
        />
      ),
    )

    return (
      <div>
        <Collapse accordion className={css(styles.collapse)} defaultActiveKey={['1']}>
          <Panel header="Exterior Plan Photos" key="1">
            <Row>
              <Col xs={24} lg={6}>
                {this.generateDropzone('exterior')}
              </Col>
              <ExtPhotoGallery axis="xy" photos={this.state.extPhotos} onSortEnd={this.sortExtPhotos} />
            </Row>
          </Panel>
        </Collapse>
        <Collapse accordion className={css(styles.collapse)} defaultActiveKey={['1']}>
          <Panel header="Interior Plan Photos" key="1">
            <Row>
              <Col className={css(styles.dropCol)} xs={24} lg={6}>
                {this.generateDropzone('interior')}
              </Col>
              <IntPhotoGallery axis="xy" photos={this.state.intPhotos} onSortEnd={this.sortIntPhotos} />
            </Row>
          </Panel>
        </Collapse>
      </div>
    )
  }
}
export default PlanPhotos
