import React, { useState } from 'react';
import { Icon, Button, Card, Alert, LoadingIndicator, Avatar } from './atoms';
import { Modal, ConfirmModal, PageHeader, EmptyState, ListItem, FormField, ModalFooter } from './molecules';
import { ResourceList } from './organisms';

const StyleGuide: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formValue, setFormValue] = useState('');

  // Sample data for ResourceList
  const sampleItems = [
    { id: '1', name: 'Item 1', description: 'Description for item 1' },
    { id: '2', name: 'Item 2', description: 'Description for item 2' },
    { id: '3', name: 'Item 3', description: 'Description for item 3' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="heading-1 mb-8">CodeLaunch Style Guide</h1>
      
      {/* Colors Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Primary Colors */}
          <Card>
            <Card.Header title="Primary Colors" />
            <Card.Body>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-primary-500 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Primary 500</p>
                    <p className="text-muted">bg-primary-500</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-primary-600 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Primary 600</p>
                    <p className="text-muted">bg-primary-600</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-primary-700 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Primary 700</p>
                    <p className="text-muted">bg-primary-700</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          {/* Gray Colors */}
          <Card>
            <Card.Header title="Gray Colors" />
            <Card.Body>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-gray-100 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Gray 100</p>
                    <p className="text-muted">bg-gray-100</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-gray-300 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Gray 300</p>
                    <p className="text-muted">bg-gray-300</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-gray-500 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Gray 500</p>
                    <p className="text-muted">bg-gray-500</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          {/* Semantic Colors */}
          <Card>
            <Card.Header title="Semantic Colors" />
            <Card.Body>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-red-500 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Error</p>
                    <p className="text-muted">bg-red-500</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-yellow-500 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Warning</p>
                    <p className="text-muted">bg-yellow-500</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded bg-green-500 mr-4"></div>
                  <div>
                    <p className="font-medium text-body">Success</p>
                    <p className="text-muted">bg-green-500</p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </section>
      
      {/* Typography Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Typography</h2>
        <Card>
          <Card.Body>
            <div className="space-y-6">
              <div>
                <h1 className="heading-1">Heading 1</h1>
                <p className="text-muted mt-1">heading-1</p>
              </div>
              <div>
                <h2 className="heading-2">Heading 2</h2>
                <p className="text-muted mt-1">heading-2</p>
              </div>
              <div>
                <h3 className="heading-3">Heading 3</h3>
                <p className="text-muted mt-1">heading-3</p>
              </div>
              <div>
                <p className="text-body">Body Text</p>
                <p className="text-muted mt-1">text-body</p>
              </div>
              <div>
                <p className="text-muted">Small Text / Caption</p>
                <p className="text-muted mt-1">text-muted</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </section>
      
      {/* Icons Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Icons</h2>
        <Card>
          <Card.Body>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <div className="flex flex-col items-center">
                <Icon name="add" size={24} />
                <p className="text-muted mt-2">add</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="edit" size={24} />
                <p className="text-muted mt-2">edit</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="delete" size={24} />
                <p className="text-muted mt-2">delete</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="error" size={24} />
                <p className="text-muted mt-2">error</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="warning" size={24} />
                <p className="text-muted mt-2">warning</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="info" size={24} />
                <p className="text-muted mt-2">info</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="success" size={24} />
                <p className="text-muted mt-2">success</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="loading" size={24} />
                <p className="text-muted mt-2">loading</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="calendar" size={24} />
                <p className="text-muted mt-2">calendar</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="user" size={24} />
                <p className="text-muted mt-2">user</p>
              </div>
              <div className="flex flex-col items-center">
                <Icon name="chevron-down" size={24} />
                <p className="text-muted mt-2">chevron-down</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </section>
      
      {/* Buttons Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Buttons</h2>
        <Card>
          <Card.Header title="Button Variants" />
          <Card.Body>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="text">Text</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </Card.Body>
        </Card>
        
        <div className="mt-6">
          <Card>
            <Card.Header title="Button Sizes" />
            <Card.Body>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </Card.Body>
          </Card>
        </div>
        
        <div className="mt-6">
          <Card>
            <Card.Header title="Button with Icons" />
            <Card.Body>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" icon="add">Add Item</Button>
                <Button variant="secondary" icon="edit">Edit</Button>
                <Button variant="danger" icon="delete">Delete</Button>
                <Button variant="primary" icon="chevron-down" iconPosition="right">
                  More Options
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
        
        <div className="mt-6">
          <Card>
            <Card.Header title="Loading Button" />
            <Card.Body>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" isLoading>Loading</Button>
                <Button variant="secondary" isLoading>Loading</Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </section>
      
      {/* Cards Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <Card.Header 
              title="Simple Card" 
              subtitle="With header and body"
            />
            <Card.Body>
              <p>This is a basic card with a header and body.</p>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header 
              title="Card with Action" 
              subtitle="Header includes an action button"
              action={<Button variant="primary" size="sm">Action</Button>}
            />
            <Card.Body>
              <p>This card includes an action button in the header.</p>
            </Card.Body>
            <Card.Footer>
              <p className="text-muted">Last updated: March 23, 2025</p>
            </Card.Footer>
          </Card>
        </div>
      </section>
      
      {/* Alerts Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Alerts</h2>
        <div className="space-y-4">
          <Alert 
            variant="error" 
            title="Error Alert" 
            message="This is an error message. Something went wrong."
          />
          
          <Alert 
            variant="warning" 
            title="Warning Alert" 
            message="This is a warning message. Proceed with caution."
          />
          
          <Alert 
            variant="info" 
            title="Info Alert" 
            message="This is an informational message."
          />
          
          <Alert 
            variant="success" 
            title="Success Alert" 
            message="This is a success message. Operation completed successfully."
          />
          
          <Alert 
            variant="info" 
            title="Alert with Action" 
            message="This alert includes an action button."
            action={<Button variant="primary" size="sm">Take Action</Button>}
          />
          
          <Alert 
            variant="warning" 
            title="Dismissible Alert" 
            message="This alert can be dismissed by clicking the X button."
            onClose={() => console.log('Alert closed')}
          />
        </div>
      </section>
      
      {/* Modals Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Modals</h2>
        <div className="space-y-4">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Basic Modal
          </Button>
          
          <Button variant="secondary" onClick={() => setIsConfirmModalOpen(true)}>
            Open Confirm Modal
          </Button>
          
          {/* Basic Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Basic Modal"
            footer={
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
              </div>
            }
          >
            <p>This is a basic modal with custom footer.</p>
          </Modal>
          
          {/* Confirm Modal */}
          <ConfirmModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            title="Confirm Action"
            confirmText="Proceed"
            cancelText="Cancel"
            onConfirm={() => {
              console.log('Confirmed');
              setIsConfirmModalOpen(false);
            }}
            confirmVariant="danger"
          >
            <p>Are you sure you want to proceed with this action?</p>
          </ConfirmModal>
        </div>
      </section>

      {/* New Components Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">New Components</h2>
        
        {/* PageHeader */}
        <Card className="mb-6">
          <Card.Header title="PageHeader" />
          <Card.Body>
            <PageHeader
              title="Page Title"
              description="This is a description of the page content."
              action={<Button variant="primary" icon="add">Add Item</Button>}
            />
          </Card.Body>
        </Card>

        {/* LoadingIndicator */}
        <Card className="mb-6">
          <Card.Header title="LoadingIndicator" />
          <Card.Body>
            <div className="flex flex-col items-center">
              <LoadingIndicator size={32} />
              <p className="text-muted mt-4">Standard Loading Indicator</p>
            </div>
          </Card.Body>
        </Card>

        {/* Avatar */}
        <Card className="mb-6">
          <Card.Header title="Avatar" />
          <Card.Body>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-center">
                <Avatar content="1" size="sm" />
                <p className="text-muted mt-2">Small</p>
              </div>
              <div className="flex flex-col items-center">
                <Avatar content="2" size="md" />
                <p className="text-muted mt-2">Medium</p>
              </div>
              <div className="flex flex-col items-center">
                <Avatar content="3" size="lg" />
                <p className="text-muted mt-2">Large</p>
              </div>
              <div className="flex flex-col items-center">
                <Avatar content="AB" size="md" />
                <p className="text-muted mt-2">Initials</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* EmptyState */}
        <Card className="mb-6">
          <Card.Header title="EmptyState" />
          <EmptyState
            iconName="info"
            title="No Items Found"
            description="There are no items to display at this time."
            action={<Button variant="primary">Create Item</Button>}
          />
        </Card>

        {/* ListItem */}
        <Card className="mb-6">
          <Card.Header title="ListItem" />
          <Card.Body>
            <ul className="divide-y divide-gray-200">
              <ListItem
                action={<Button variant="secondary" size="sm" icon="edit">Edit</Button>}
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">List Item 1</div>
                  <div className="text-muted">Description for item 1</div>
                </div>
              </ListItem>
              <ListItem
                action={<Button variant="secondary" size="sm" icon="edit">Edit</Button>}
                onClick={() => console.log('Item clicked')}
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">List Item 2 (Clickable)</div>
                  <div className="text-muted">Description for item 2</div>
                </div>
              </ListItem>
            </ul>
          </Card.Body>
        </Card>

        {/* FormField */}
        <Card className="mb-6">
          <Card.Header title="FormField" />
          <Card.Body>
            <FormField
              id="example-field"
              label="Example Field"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="Enter some text"
            />
          </Card.Body>
        </Card>

        {/* ModalFooter */}
        <Card className="mb-6">
          <Card.Header title="ModalFooter" />
          <Card.Body>
            <ModalFooter
              onConfirm={() => console.log('Confirmed')}
              onCancel={() => console.log('Cancelled')}
              confirmText="Save Changes"
              cancelText="Cancel"
            />
          </Card.Body>
        </Card>

        {/* ResourceList */}
        <Card className="mb-6">
          <Card.Header title="ResourceList" />
          <Card.Body>
            <h3 className="heading-3 mb-4">With Items</h3>
            <ResourceList
              items={sampleItems}
              isLoading={false}
              emptyState={{
                iconName: "info",
                title: "No Items",
                description: "No items to display"
              }}
              renderItem={(item) => (
                <ListItem
                  action={<Button variant="secondary" size="sm" icon="edit">Edit</Button>}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-muted">{item.description}</div>
                  </div>
                </ListItem>
              )}
              keyExtractor={(item) => item.id}
            />

            <h3 className="heading-3 mt-8 mb-4">Empty State</h3>
            <ResourceList
              items={[]}
              isLoading={false}
              emptyState={{
                iconName: "info",
                title: "No Items",
                description: "No items to display",
                action: <Button variant="primary">Create Item</Button>
              }}
              renderItem={() => <></>}
              keyExtractor={() => ""}
            />

            <h3 className="heading-3 mt-8 mb-4">Loading State</h3>
            <ResourceList
              items={null}
              isLoading={true}
              emptyState={{
                iconName: "info",
                title: "No Items",
                description: "No items to display"
              }}
              renderItem={() => <></>}
              keyExtractor={() => ""}
            />
          </Card.Body>
        </Card>
      </section>
      
      {/* Usage Guidelines Section */}
      <section className="mb-12">
        <h2 className="heading-2 mb-4">Usage Guidelines</h2>
        <Card>
          <Card.Body>
            <div className="prose max-w-none">
              <h3>Component Usage</h3>
              <p>
                When building new features, use the components from this style guide to ensure
                consistency across the application. Import components from their respective
                locations:
              </p>
              <pre className="bg-gray-100 p-4 rounded dark:bg-gray-800">
                {`import { Button, Card, Alert, LoadingIndicator, Avatar } from '../components/atoms';
import { Modal, PageHeader, EmptyState, ListItem, FormField } from '../components/molecules';
import { ResourceList } from '../components/organisms';`}
              </pre>
              
              <h3 className="mt-6">Tailwind Classes</h3>
              <p>
                For custom styling needs, use the predefined Tailwind classes and utilities.
                Prefer using the color variables defined in the theme (e.g., <code>bg-primary-600</code>)
                instead of hardcoded color values.
              </p>
              
              <h3 className="mt-6">Icons</h3>
              <p>
                Use the Icon component for all icons in the application. This ensures consistent
                styling and makes it easy to update icons globally.
              </p>
              <pre className="bg-gray-100 p-4 rounded dark:bg-gray-800">
                {`<Icon name="add" size={20} className="text-gray-500" />`}
              </pre>
              
              <h3 className="mt-6">Responsive Design</h3>
              <p>
                All components are designed to be responsive. Use the provided responsive
                utilities from Tailwind (e.g., <code>sm:, md:, lg:</code>) for custom responsive
                behavior.
              </p>
            </div>
          </Card.Body>
        </Card>
      </section>
    </div>
  );
};

export default StyleGuide;
