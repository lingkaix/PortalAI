# PortalAI Architecture Rules

## Design Principles
- Follow SOLID principles
- Apply DRY (Don't Repeat Yourself) principle
- Follow YAGNI (You Ain't Gonna Need It) principle
- Design for modularity and separation of concerns
- Consider scalability and performance in architectural decisions
- Prioritize maintainability in all architectural choices
- Design for extensibility where appropriate

## Component Architecture
- Clear component boundaries with well-defined responsibilities
- Minimize coupling between modules
- Use interfaces/abstractions for decoupling
- Define clear inputs, outputs, and responsibilities for each component
- Implement proper dependency injection

## State Management
- Use Zustand for global state management
- Follow unidirectional data flow
- Keep state as local as possible
- Use React Context for theme/UI state
- Implement proper state persistence where needed

## API Design
- Follow RESTful principles for backend APIs
- Use consistent naming conventions
- Implement proper error handling and status codes
- Design clear request/response schemas
- Document all public APIs

## Data Flow
- Implement clear data flow patterns
- Use proper data validation
- Handle asynchronous operations consistently
- Implement proper error boundaries
- Use appropriate caching strategies

## Security Architecture
- Implement proper authentication and authorization
- Follow the principle of least privilege
- Secure all data in transit and at rest
- Implement proper input validation
- Handle sensitive data appropriately
- Follow Tauri's security best practices

## Memory Management
- Implement proper memory management for agents
- Design clear memory hierarchies
- Handle memory persistence appropriately
- Implement proper memory cleanup
- Design for memory efficiency

## Tool Integration
- Design clear tool interfaces
- Implement proper tool authorization
- Handle tool errors gracefully
- Design for tool extensibility
- Implement proper tool lifecycle management

## Configuration Management
- Externalize all configuration
- Use environment-specific settings
- Implement proper configuration validation
- Design for configuration flexibility
- Handle sensitive configuration appropriately

## Error Handling
- Implement comprehensive error handling
- Use appropriate error types
- Log errors with proper context
- Handle errors gracefully
- Implement proper error recovery

## Performance Architecture
- Design for scalability
- Implement proper caching
- Use appropriate data structures
- Design for efficient resource usage
- Implement proper performance monitoring

## Testing Architecture
- Design for testability
- Implement proper test boundaries
- Use appropriate testing strategies
- Design for test isolation
- Implement proper test data management
